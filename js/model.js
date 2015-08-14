// ;
// (function() {
//         'use strict';

        var $ = jQuery.noConflict();

        // "Array.prototype" allows us to add aditional methods to the Array object. Here we add "insert" and "delete" methods

        // "insert" method lets us add an element at any index
        // e.g.
        // [a,b,d].insert('c', 2); // [a,b,c,d]
        Array.prototype.insert = function(element, index) {
            this.splice(index, 0, element);
        }

        // "remove" method lets us remove elements within index range
        // e.g.
        // [a,b,c,d].remove(0, 2); // [d]
        Array.prototype.delete = function(startIndex, endIndex) {
            return this.splice(startIndex, (endIndex - startIndex) + 1);
        }


        String.prototype.insert = function (index, string) {
          if (index > 0)
            return this.substring(0, index) + string + this.substring(index, this.length);
          else
            return string + this;
        }


        // If authorviz is already exist, use it. Otherwise make a new object
        window.docuviz = window.docuviz || {}

        $.extend(window.docuviz, {

                // "str" stores all the Character objects from a Google Doc
                str: [],


                // Render method construct HTML DOM element from a set of Character and Author Data
                render: function(chars, authors) {
                    return _.reduce(chars, function(memo, obj) {
                        var author = _.where(authors, {
                            id: obj.aid
                        });

                        if (obj.s === "\n") {
                            return memo + "<br>";
                        } else {
                            return memo + '<span style="color:' + author[0]['color'] + '">' + obj.s + '</span>';
                        }

                    }, '');
                },


                renderToString: function(chars) {
                    //return '<p>hello world</p>';
                    return _.reduce(chars, function(memo, obj) {
                        //var author = _.where(authors, {id: obj.aid});

                        if (obj.s === "\n") {
                            return memo + "\n";
                        } else {
                            return memo + obj.s;
                        }

                    }, '');
                },

                // Construct method constructs the "str" variable
                construct: function(entry, authorId) {
                    var that = this,
                        type = entry.ty,
                        insertStartIndex = null,
                        deleteStartIndex = null,
                        deleteEndIndex = null;

                    if (type === 'mlti') {
                        _.each(entry.mts, function(ent) {
                            that.construct(ent, authorId);
                        });

                    } else if (type === 'rplc') {
                        _.each(entry.snapshot, function(ent) {
                            that.construct(ent, authorId);
                        });

                    }    

                        else if (type === 'rvrt') {
                            that.str = [];
                        _.each(entry.snapshot, function(ent) {
                            that.construct(ent, authorId);
                        });



                    } else if (type === 'is') {
                        insertStartIndex = entry.ibi;

                        // Break string downs into character and add individual character to 'str' array
                        _.each(entry.s, function(character, index) {
                            var charObj = {
                                s: character,
                                aid: authorId
                            };

                            that.str.insert(charObj, (insertStartIndex - 1) + index);
                            // that.allSegmentsInCurrentRev.push(segment());
                        });

                    } else if (type === 'ds') {
                        deleteStartIndex = entry.si;
                        deleteEndIndex = entry.ei;

                        this.str.delete(deleteStartIndex - 1, deleteEndIndex - 1);
                    } else if (type === 'as') {

                        var stringModifications = entry.sm,
                            startIndex = entry.si,
                            endIndex = entry.ei,
                            specialType = entry.st
                            // console.log(entry);
                        for (var i = startIndex - 1; i < endIndex; i++) {
                            $.extend(that.str[i], stringModifications)
                        }
                    } else {
                        // todo
                    }

                    return true;
                },


                allSegmentsInCurrentRev: [],
                tempConstructSegmentsForCurrentRev: [],
                firstRevisionSegments: [],
                segmentsArray: [],
                allSegmentsInCurrentRev: [],
                revID: 0,
                currentSegID: 0,
                firstChangeAfterFirstRevision: null,



                oneSegment: function(authorColor, segID, parentSegID, offset, segStr, segLength, revID){
                    return {
                        authorColor: authorColor,
                        segID: segID,
                        parentSegID: parentSegID,
                        offset: offset,
                        segStr: segStr,
                        segLength: segLength,
                        revID: revID
                    };
                },

                constructSegment: function(author, segStr, segID, parentSegID, offset, revID, beginIndex, endIndex, type, permanent) {
                    return {
                        author: author,
                        segStr: segStr,
                        segID: segID,
                        parentSegID: parentSegID,
                        offset: offset,
                        revID: revID,
                        beginIndex: beginIndex,
                        endIndex: endIndex,
                        type: type,
                        permanent: permanent
                    };
                },

                findParentSegmentHelper: function(locationBasedOnLength, segmentID) {
                    return {
                        locationBasedOnLength: locationBasedOnLength,
                        segmentID: segmentID
                    };
                },


                constructForDocuviz: function(entry, authorId, currentRevID, currentSegID, segsInPrevRev, prevStr, pleaseContinue) {
                    var that = this,
                        type = entry.ty,
                        previousType = entry.ty,
                        insertStartIndex = null,
                        deleteStartIndex = null,
                        deleteEndIndex = null;


                    if (type === 'mlti') {
                        _.each(entry.mts, function(ent) {
                            that.constructForDocuviz(ent, authorId, currentRevID, currentSegID, segsInPrevRev, prevStr, pleaseContinue);
                        });
                    } else if (type === 'rplc') {
                        _.each(entry.snapshot, function(ent) {
                            that.constructForDocuviz(ent, authorId, currentRevID, currentSegID, segsInPrevRev, prevStr, pleaseContinue);
                        });

                    } else if (type === 'rvrt') {
                        that.str = [];
                        that.allSegmentsInCurrentRev = [];
                        _.each(entry.snapshot, function(ent) {
                            that.constructForDocuviz(ent, authorId, currentRevID, currentSegID, segsInPrevRev, prevStr, pleaseContinue);
                        });

                    } else if (type === 'is') {
                        // the first rev


                        if (segsInPrevRev === null) {
                            insertStartIndex = entry.ibi;
                            _.each(entry.s, function(character, index) {
                                var charObj = {
                                    s: character,
                                    aid: authorId
                                };

                                that.str.insert(charObj, (insertStartIndex - 1) + index);
                            });
                            
                        }

                        // calculating the second and following revs, using the segs in previous rev
                        else {

                            insertStartIndex = entry.ibi;



                            if (that.firstRevisionSegments.length > 0){
                                //that.buildSegmentsWhenInsertForDocuviz(entry.s, insertStartIndex, authorId, that.firstRevisionSegments);
                                that.allSegmentsInCurrentRev = that.buildSegmentsWhenInsert(entry.s, insertStartIndex, authorId, that.firstRevisionSegments, previousType);
                                //console.log("first insert after firstRevisionSegments for entry: " + entry.s);
                                //console.log(that.allSegmentsInCurrentRev);
                                that.firstRevisionSegments = [];

                            }

                            else{
                                 that.allSegmentsInCurrentRev = that.buildSegmentsWhenInsert(entry.s, insertStartIndex, authorId, that.allSegmentsInCurrentRev, previousType);

                                //that.buildSegmentsWhenInsertForDocuviz(entry.s, insertStartIndex, authorId, that.allSegmentsInCurrentRev);

                            };


                            _.each(entry.s, function(character, index) {
                                var charObj = {
                                    s: character,
                                    aid: authorId
                                };
                                that.str.insert(charObj, (insertStartIndex - 1) + index);
                            });


                            
                        }

                        previousType = 'is';


                    } else if (type === 'ds') {
                        // the first rev
                        if (segsInPrevRev === null) {
                            deleteStartIndex = entry.si;
                            deleteEndIndex = entry.ei;
                            //that.tempSegLength -= (deleteEndIndex - deleteStartIndex + 1);
                            this.str.delete(deleteStartIndex - 1, deleteEndIndex - 1);
                
                        }
                        // calculating the second and following revs, using the segs in previous rev

                        else {

                            deleteStartIndex = entry.si;
                            deleteEndIndex = entry.ei;
                            this.str.delete(deleteStartIndex - 1, deleteEndIndex - 1);
                            


                            if (that.firstRevisionSegments.length > 0){
                                that.allSegmentsInCurrentRev = that.deleteSegments(deleteStartIndex, deleteEndIndex, authorId, that.firstRevisionSegments, previousType);
                                //console.log("first delete after firstRevisionSegments:");
                                //console.log(that.allSegmentsInCurrentRev);
                                that.firstRevisionSegments = [];

                            }

                            else{
                                that.allSegmentsInCurrentRev = that.deleteSegments(deleteStartIndex, deleteEndIndex, authorId, that.allSegmentsInCurrentRev, previousType);

                            }

                            
                            
                            

                           // that.deleteSegments(deleteStartIndex, deleteEndIndex, authorId, that.allSegmentsInCurrentRev);
                            
                        }

                        previousType = 'ds';
                    }


                        // todo delete the CODE
                        // else if (type === 'as') {
                        //     var stringModifications = entry.sm,
                        //         startIndex = entry.si,
                        //         endIndex = entry.ei,
                        //         specialType = entry.st

                        //     for (var i = startIndex - 1; i < endIndex; i++) {
                        //         $.extend(that.str[i], stringModifications)
                        //     };
                        // } else {}

                        return true;
                    },



                    buildRevisions: function(vizType, docId, changelog, authors, revTimestamps, revAuthors) {
                        // Clear previous revision data
                        this.str = [];
                        var that = this,
                            soFar = 0,
                            editCount = changelog.length,
                            html = '',
                            command = null,
                            authorId = null,
                            revs = [],
                            revs2 = [],
                            currentRevID = 0,
                            intervalChangesIndex = [],
                            //currentSegID = 0,
                            segsInPrevRev = null,
                            differentAuthor = null;
                            that.currentSegID = 0;
                            that.revID = 0;

                       // if (vizType === 'docuviz') {
                        intervalChangesIndex = this.calculateIntervalChangesIndex(changelog, revTimestamps);
                        console.log(authors);
                        console.log(intervalChangesIndex);
                        //};
                        console.log("editCount: " + editCount);
                        // ***
                        // var prevAuthor = _.find(authors, function(eachAuthor) {
                        //     return eachAuthor.id === authors[0].id;
                        // });


                        // Async run through each entry in a synchronous sequence.
                        async.eachSeries(changelog, function(entry, callBack) {
                            authorId = entry[2],
                            command = entry[0];

                            // Find author object based on authorId:

                            var currentAuthor = _.find(authors, function(eachAuthor) {
                                return eachAuthor.id === authorId;
                            });


                            // Retrieve the Google Doc Tab and send a message to that Tab's view
                            chrome.tabs.query({
                                url: '*://docs.google.com/*/' + docId + '/edit'
                            }, function(tabs) {
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    msg: 'progress',
                                    soFar: soFar + 1
                                }, function(response) {


                                    // Update progress bar
                                    soFar += 1;

                                    if (vizType === 'authorviz') {
                                        that.construct(command, authorId);


                                        if (soFar === editCount) {
                                            html = that.render(that.str, authors);
                                            chrome.tabs.query({
                                                url: '*://docs.google.com/*/' + docId + '/edit'
                                            }, function(tabs) {
                                                chrome.tabs.sendMessage(tabs[0].id, {
                                                    msg: 'render',
                                                    html: html
                                                }, function(response) {});
                                            });

                                        };                                


                                    } else if (vizType === 'docuviz') {



                                        //if (soFar <= 135){
                                        that.constructForDocuviz(command, authorId, that.revID, that.currentSegID, segsInPrevRev, that.prevStr, that.pleaseContinue);
                                        //console.log(revs);
                                        //};

                                        //console.log("SoFar: " + soFar);
                                       //that.construct(command, authorId);

                                        // reaching the end of changelog
                                        if (soFar === editCount) {
                                            console.log('the end of changelog');
                                            chrome.tabs.query({
                                                url: '*://docs.google.com/*/' + docId + '/edit'
                                            }, function(tabs) {
                                                chrome.tabs.sendMessage(tabs[0].id, {
                                                    msg: 'renderDocuviz',
                                                    chars: that.str,
                                                    revData: revs2
                                                }, function(response) {});
                                            });
                                        };
                                        if (currentRevID < intervalChangesIndex.length) {

                                            if (soFar === intervalChangesIndex[currentRevID]+1) {
                                                // if this is the first revision, first cutting point
                                                if (currentRevID === 0) {
                                                    //var segments = that.buildAuthorsSegment(that.str, authors);
                                                    //revs.push([that.str.length, revTimestamps[currentRevID], revAuthors[currentRevID], segments]);

                                                    that.firstRevisionSegments.push(that.constructSegment(currentAuthor.id, that.renderToString(that.str), that.currentSegID, that.currentSegID, 0, that.revID, 0, that.str.length,'type', true));

                                                    // that.currentSegID += 1;

                                                    var segments2 = that.buildSegmentsForOneRevision(that.firstRevisionSegments, authors);

                                                    revs2.push([that.str.length, revTimestamps[currentRevID], revAuthors[currentRevID], segments2]);

                                                    //console.log(that.firstRevisionSegments);

                                                    //that.allSegmentsInCurrentRev = []; // clear all segments in the current Rev to prepare for the next Rev 
                                                    currentRevID += 1;
                                                    that.revID +=1;
                                                    segsInPrevRev = revs2[0][3]; // set the segsInPrevRev to the first rev to prepare for the second one
                                                    //that.firstChangeAfterFirstRevision = true;
                                                   // that.firstRevisionSegments = revs2[0][3];
                                                   // that.tempSegLength = 0;
                                                   // that.prevStr = that.str;
                                                  //  that.pleaseContinue = false;


                                                    // after this point construct begin to take segsInPrevRev into consideration. From now on, sigInPrevRev is not null anymore    
                                                }

                                                // Until the next cutting point, the construct is still running:
                                                // Other cutting points, where we should push rev into revs 
                                                else {
                                                    //console.log("prevAuthor: ", prevAuthor.name);
                                                    //console.log(that.theOne);
                                                    //that.theOne = [];

                                                  //  that.pleaseContinue = false;
                                                    //var segments = that.buildAuthorsSegment(that.str, authors);
                                                    //revs.push([that.str.length, revTimestamps[currentRevID], revAuthors[currentRevID], segments]);

                                                    var tempSegments = [];
                                                    var segLength = 0;
                                                    //console.log("curent revID: " + currentRevID);
                                                    _.each(that.allSegmentsInCurrentRev, function(eachSegment){
                                                        eachSegment.revID = currentRevID;
                                                        eachSegment.permanent = true;
                                                        tempSegments.push(eachSegment);
                                                        //console.log(eachSegment);
                                                        //segLength += eachSegment.segtStr.length;

                                                    });

                                                    that.allSegmentsInCurrentRev = tempSegments;

                                                    var segments2 = that.buildSegmentsForOneRevision(that.allSegmentsInCurrentRev, authors);

                                                    // if (segments2.length ==1 && segments2[0].segStr.length===0){
                                                    //     console.log("midle is blank");
                                                    //     console.log("soFar is: " + soFar);
                                                    //     console.log(segments2);
                                                    // }

                                                    revs2.push([that.str.length, revTimestamps[currentRevID], revAuthors[currentRevID], segments2]);



                                                    
                                                     //console.log(that.allSegmentsInCurrentRev);

                                                     //console.log(revs);
                                                     // that.firstRevisionSegments = that.allSegmentsInCurrentRev;
                                                    // that.firstChangeAfterFirstRevision = true;
                                                    //console.log(segments2);
                                                    //segsInPrevRev = that.tempConstructSegmentsForCurrentRev;
                                                    // that.allSegmentsInCurrentRev = [];
                                                    //that.currentSegID = 0;
                                                    currentRevID += 1;

                                                    that.revID += 1;
                                                    //that.tempSegLength = 0;
                                                    // the next cutting point is reached, set segInPrevRev to the previous rev
                                                    //that.prevStr = that.str;
                                                };

                                            }


                                            else {
                                            // where we calculate the segments, but not pushing rev

                                            };

                                        };


                                    };

                                    // Callback lets async knows that the sequence is finished can it can start run another entry           
                                    callBack();
                                });
                            });
                        });
                    },


                    toLocationBased: function(segmentsArray){
                        var result = [];
                        var locationSoFar = 0;
                        var that = this;
                        for (var i = 0; i < segmentsArray.length; i++) {

                            if (i === 0) {
                                result.push(that.findParentSegmentHelper([1,segmentsArray[i].segStr.length], segmentsArray[i]));
                            } else {
                                result.push(that.findParentSegmentHelper([result[locationSoFar].locationBasedOnLength[1]+1,(result[locationSoFar].locationBasedOnLength[1] + segmentsArray[i].segStr.length)], segmentsArray[i]));
                                locationSoFar += 1;
                            };
                        };

                        return result;


                    },



                    buildSegmentsWhenInsert: function(entry,startIndex, author, segmentsArray, previousType){

                        var segmentsBefore = [];
                        var result = segmentsArray;
                        var that = this;
                        //var locationBased = that.convertToLocationBased(segmentsArray);
                        var locationBased2 = that.toLocationBased(segmentsArray);

                        //var belongTo = null;


                       // console.log("locationBased");
                       // console.log(locationBased);


                        // console.log("TOlocationBased2");
                        // console.log(locationBased2);

                        // console.log("**** insertStartIndex:" + startIndex);
                        // console.log("**** insert string:" + _.escape(entry));
                        // // console.log("author: " + author);


                        var segmentLocation = 0;
                        var effectedSegment = null;
                        _.each(locationBased2, function(eachSegment, index){
                            if (startIndex === eachSegment.locationBasedOnLength[0]){
                                if ( index === 0 ){
                                    effectedSegment = eachSegment;
                                    segmentLocation = index;  
                                }
                                else{
                                    if (locationBased2[index-1].segmentID.author === author){
                                        effectedSegment = locationBased2[index-1];
                                        segmentLocation = index-1;
                                    }
                                    else if (author === eachSegment.segmentID.author){
                                        effectedSegment = eachSegment;
                                        segmentLocation = index;
                                    }
                                    else {
                                        effectedSegment = eachSegment;
                                        segmentLocation = index;                                    
                                    }
                                }

                            }
                            else if (eachSegment.locationBasedOnLength[0] < startIndex && startIndex <= eachSegment.locationBasedOnLength[1]){
                                segmentLocation = index;
                                effectedSegment = eachSegment;
                            }
                            else {}

                        });
                        if (effectedSegment === null){
                                that.currentSegID += 1;
                                var currentSeg = that.constructSegment(author, entry, that.currentSegID, that.currentSegID, 0, that.revID, startIndex, startIndex + entry.length -1, "middle part where author != prev author", false);

                                result.insert(currentSeg, locationBased2.length);
                        }

                        // console.log("Belong to index: " + segmentLocation);
                        // console.log(effectedSegment);

                        //if (author === effectedSegment.segmentID.author){

                        else {

                            if (author === effectedSegment.segmentID.author && (that.revID === effectedSegment.segmentID.revID)) {
                                //console.log("same author");
                                //if (that.revID === effectedSegment.segmentID.revID){
                                    var strInBelongTo = effectedSegment.segmentID.segStr;
                                    // console.log("length before: " + strInBelongTo.length);
                                    strInBelongTo = strInBelongTo.insert(startIndex-effectedSegment.locationBasedOnLength[0], entry);
                                    // console.log("insert for same author at: " + (startIndex-effectedSegment.locationBasedOnLength[0]));
                                    // console.log("length after: " + strInBelongTo.length);
                                    result[segmentLocation].segStr = strInBelongTo;
                                    result[segmentLocation].permanent = false;
                                    //that.firstChangeAfterFirstRevision = true;
                                    //if (that.currentSegID === 182){
                                    if (effectedSegment.segmentID.segID === 182){
                                        console.log(previousType);
                                        console.log("break point: 9");
                                    }

                            }

                            // else if (author === effectedSegment.segmentID.author && (that.revID === effectedSegment.segmentID.revID) && previousType === 'ds'){
                            //     that.currentSegID += 1;
                            //     var currentSeg = that.constructSegment(author, entry, that.currentSegID, that.currentSegID, 0, that.revID, startIndex, startIndex + entry.length -1, "middle part where author != prev author", false);
                            //     console.log("break point 9");
                            //     result.insert(currentSeg, segmentLocation+1);
                            // }

                            else { // when author != effectedSegment.segmentID.author
                                var strInBelongTo = effectedSegment.segmentID.segStr;
                                //console.log("author is different");

                                // if (that.revID != effectedSegment.segmentID.revID){
                                //     that.firstChangeAfterFirstRevision = true;
                                // }

                                var strBeforeStartIndex = strInBelongTo.substring(0, startIndex - effectedSegment.locationBasedOnLength[0]);
                                //console.log("strBeforeStartIndex start from: " + effectedSegment.locationBasedOnLength[0] + "to: " + (startIndex - effectedSegment.locationBasedOnLength[0]-1));
                                var strAfterStartIndex = strInBelongTo.substring(startIndex - effectedSegment.locationBasedOnLength[0]);
                                //console.log("strAfterStartIndex start from: " + (startIndex - effectedSegment.locationBasedOnLength[0]-1) + "to: " + (effectedSegment.locationBasedOnLength[1] - insertStartIndex));

                                if (strBeforeStartIndex.length>0){

                                    result.delete(segmentLocation, segmentLocation);

                                    //var offSet = startIndex- effectedSegment.locationBasedOnLength[0];
                                    that.currentSegID += 1;
                                    if (that.currentSegID === 182){
                                        console.log("break point 1");
                                    }

                                    if (effectedSegment.segmentID.permanent === true) {
                                        var segBefore = that.constructSegment(effectedSegment.segmentID.author, strBeforeStartIndex, that.currentSegID, effectedSegment.segmentID.segID, 0, that.revID,effectedSegment.locationBasedOnLength[0],startIndex - effectedSegment.locationBasedOnLength[0], "from buildSegment Before in author !=  segment author when permanent = true", false);
                                    }

                                    else {
                                        var segBefore = that.constructSegment(effectedSegment.segmentID.author, strBeforeStartIndex, that.currentSegID, effectedSegment.segmentID.parentSegID, effectedSegment.segmentID.offset, that.revID,effectedSegment.locationBasedOnLength[0],startIndex - effectedSegment.locationBasedOnLength[0], "from buildSegment Before in author !=  segment author when permanent = false", false);
                                        
                                     }

                                    result.insert(segBefore, segmentLocation)
                                    that.currentSegID += 1;
                                    if (that.currentSegID === 182){
                                        console.log("break point 2");
                                    }

                                    var currentSeg = that.constructSegment(author, entry, that.currentSegID, that.currentSegID, 0, that.revID, startIndex, startIndex + entry.length -1, "middle part where author != prev author", false);

                                    result.insert(currentSeg, segmentLocation+1);


                                    if (strAfterStartIndex.length>0){
                                        that.currentSegID += 1;
                                        if (that.currentSegID === 182){
                                            console.log("break point 3");
                                        }
                                        // calculate offset in here
                                        var offset = startIndex- effectedSegment.locationBasedOnLength[0];


                                         if (effectedSegment.segmentID.permanent === true){
                                             var segAfter = that.constructSegment(effectedSegment.segmentID.author, strAfterStartIndex, that.currentSegID, effectedSegment.segmentID.segID, offset, that.revID,startIndex+entry.length, effectedSegment.locationBasedOnLength[1] + entry.length, "from buildSegment After in author !=  segment author when permanent = true", false);
                                         }

                                         else{ 
                                            var segAfter = that.constructSegment(effectedSegment.segmentID.author, strAfterStartIndex, that.currentSegID, effectedSegment.segmentID.parentSegID, offset + effectedSegment.segmentID.offset, that.revID,startIndex+entry.length, effectedSegment.locationBasedOnLength[1] + entry.length, "from buildSegment After in author !=  segment author when permanent = false", false);
                                         }
                                        result.insert(segAfter, segmentLocation+2);
                                        //that.firstChangeAfterFirstRevision = false;

                                    };

                                }

                                else { // handle the case where before Str is blank

                                    // result.delete(segmentLocation, segmentLocation);

                                    that.currentSegID += 1;
                                    if (that.currentSegID === 182){
                                        console.log("break point 4");
                                    }
                                    var currentSeg = that.constructSegment(author, entry, that.currentSegID, that.currentSegID, 0, that.revID, startIndex, startIndex + entry.length - 1, "middle part where author != prev author", false);

                                    result.insert(currentSeg, segmentLocation);
                                    // var offSet = startIndex- effectedSegment.locationBasedOnLength[0];

                                    // if (strAfterStartIndex.length>0){
                                    //     that.currentSegID += 1;
                                    //   //  if (that.firstChangeAfterFirstRevision === true){
                                    //     var segAfter = that.constructSegment(effectedSegment.segmentID.author, strAfterStartIndex, that.currentSegID, effectedSegment.segmentID.segID, offSet, that.revID,startIndex - effectedSegment.locationBasedOnLength[0] + entry.length, effectedSegment.locationBasedOnLength[1] + entry.length, "from buildSegment After in author !=  segment author");
                                    //         //that.firstChangeAfterFirstRevision = false;
                                    //    // }
                                    //     //else{
                                    //       //  var segAfter = that.constructSegment(effectedSegment.segmentID.author, strAfterStartIndex, that.currentSegID, effectedSegment.segmentID.parentSegID, offSet, that.revID,startIndex - effectedSegment.locationBasedOnLength[0] + entry.length, effectedSegment.locationBasedOnLength[1] + entry.length, "from buildSegment After in author !=  segment author");

                                    //    // };

                                    //     result.insert(segAfter, segmentLocation+1);
                                    //     that.firstChangeAfterFirstRevision = false;

                                    // };

                                };

                            }

                        }



                        return result;
                        
                    },


                    deleteSegments: function(deleteStartIndex, deleteEndIndex, author, segmentsArray, previousType){
                        // var segmentsBefore = [];
                        // var segmentsAfter = [];
                        var result = segmentsArray;

                        var that = this;
                        //var locationBased = that.convertToLocationBased(segmentsArray);
                        var locationBased2 = that.toLocationBased(segmentsArray);

                        // console.log("locationBased");
                        // console.log(locationBased);


                        // console.log("locationBased2: ");
                        // console.log(locationBased2);


                        // console.log("deleteStartIndex" + deleteStartIndex);
                        // console.log("deleteEndIndex" + deleteEndIndex);

                        if (deleteStartIndex===deleteEndIndex){ 
                            //console.log("WHEN deleteStartIndex ==== deleteEndIndex");

                            var deleteSegmentLocation = 0;
                            var effectedSegmentOfDelete = null;

                            _.each(locationBased2, function(eachSegment, index){
                                if (eachSegment.locationBasedOnLength[0] <= deleteStartIndex && deleteStartIndex <= eachSegment.locationBasedOnLength[1]){
                                    deleteSegmentLocation = index;
                                    effectedSegmentOfDelete = eachSegment;
                                }
                            });

                            if (effectedSegmentOfDelete != null) {
                                var strInBelongTo = effectedSegmentOfDelete.segmentID.segStr;
                                //console.log("before delete: " + strInBelongTo);
                                //console.log("delete from:" + (deleteStartIndex-effectedSegmentOfDelete.locationBasedOnLength[0]) + "to: " + (deleteStartIndex- effectedSegmentOfDelete.locationBasedOnLength[0]+1));
                                strInBelongTo = strInBelongTo.substring(0, deleteStartIndex-effectedSegmentOfDelete.locationBasedOnLength[0])+strInBelongTo.substring(deleteStartIndex- effectedSegmentOfDelete.locationBasedOnLength[0]+1);

                                result[deleteSegmentLocation].segStr = strInBelongTo;
                               // result[deleteSegmentLocation].permanent = false;
                                //console.log("after delete: " + result[deleteSegmentLocation].segStr);

                            }

                        }



                        else{ // when deleteStartIndex != deleteEndIndex 
                            //console.log("WHEN deleteStartIndex != deleteEndIndex");

                            var deleteStartSegmentLocation = 0;
                            var effectedSegmentOfDeleteStart = null;
                            var deleteEndSegmentLocation = 0;
                            var effectedSegmentOfDeleteEnd = null;

                            _.each(locationBased2, function(eachSegment, index){
                                if (eachSegment.locationBasedOnLength[0] <= deleteStartIndex && deleteStartIndex <= eachSegment.locationBasedOnLength[1]){
                                    deleteStartSegmentLocation = index;
                                    effectedSegmentOfDeleteStart = eachSegment;
                                }
                            });


                            _.each(locationBased2, function(eachSegment, index){
                                if (eachSegment.locationBasedOnLength[0] <= deleteEndIndex && deleteEndIndex <= eachSegment.locationBasedOnLength[1]){
                                    deleteEndSegmentLocation = index;
                                    effectedSegmentOfDeleteEnd = eachSegment;
                                }
                            });


                            if (deleteStartSegmentLocation === deleteEndSegmentLocation){ //within segment
                                //console.log("delete within segment");
                                if (effectedSegmentOfDeleteStart != null) {

                                    var strInBelongTo = effectedSegmentOfDeleteStart.segmentID.segStr;
                                    result.delete(deleteStartSegmentLocation, deleteStartSegmentLocation);
                                    //strInBelongTo = strInBelongTo.substring(0, deleteStartIndex-effectedSegmentOfDeleteStart.locationBasedOnLength[0])+strInBelongTo.substring(deleteEndIndex- effectedSegmentOfDeleteStart.locationBasedOnLength[0]+1);
                                    var strBefore = strInBelongTo.substring(0, deleteStartIndex-effectedSegmentOfDeleteStart.locationBasedOnLength[0]);
                                    var strAfter = strInBelongTo.substring(deleteEndIndex- effectedSegmentOfDeleteStart.locationBasedOnLength[0]+1);

                                    if (strAfter.length > 0){
                                        that.currentSegID += 1;
                                        if (that.currentSegID === 182){
                                            console.log("break point 5");
                                        }
                                         if (effectedSegmentOfDeleteStart.segmentID.permanent === true){
                                            var segAfter = that.constructSegment(effectedSegmentOfDeleteStart.segmentID.author, strAfter, that.currentSegID, effectedSegmentOfDeleteStart.segmentID.segID, deleteEndIndex- effectedSegmentOfDeleteStart.locationBasedOnLength[0]+1 , that.revID,effectedSegmentOfDeleteStart.locationBasedOnLength[0], deleteStartIndex-1, "from delete Before when start != end within segment", false);
                                           
                                         }
                                        else {
                                            var segAfter = that.constructSegment(effectedSegmentOfDeleteStart.segmentID.author, strAfter, that.currentSegID, effectedSegmentOfDeleteStart.segmentID.parentSegID, deleteEndIndex- effectedSegmentOfDeleteStart.locationBasedOnLength[0]+1 + effectedSegmentOfDeleteStart.segmentID.offset, that.revID,effectedSegmentOfDeleteStart.locationBasedOnLength[0], deleteStartIndex-1, "from delete Before when start != end", false);
                                           // var segAfter = that.constructSegment(effectedSegmentOfDeleteStart.segmentID.author, strAfter, that.currentSegID, effectedSegmentOfDeleteStart.segmentID.segID, deleteEndIndex- effectedSegmentOfDeleteStart.locationBasedOnLength[0]+1 , that.revID,effectedSegmentOfDeleteStart.locationBasedOnLength[0], deleteStartIndex-1, "from delete Before when start != end within segment", false);

                                        }

                                        result.insert(segAfter, deleteStartSegmentLocation);
                                    } 


                                    if (strBefore.length > 0){
                                        that.currentSegID +=1;
                                        if (that.currentSegID === 182){
                                            console.log("break point 6");
                                        }
                                        if (effectedSegmentOfDeleteStart.segmentID.permanent === true){
                                            var segBefore = that.constructSegment(effectedSegmentOfDeleteStart.segmentID.author, strBefore, that.currentSegID, effectedSegmentOfDeleteStart.segmentID.segID, 0, that.revID,effectedSegmentOfDeleteStart.locationBasedOnLength[0], deleteStartIndex-1, "from delete Before when start != end within segment", false);

                                        }

                                        else{
                                            var segBefore = that.constructSegment(effectedSegmentOfDeleteStart.segmentID.author, strBefore, that.currentSegID, effectedSegmentOfDeleteStart.segmentID.parentSegID, effectedSegmentOfDeleteStart.segmentID.offset, that.revID,effectedSegmentOfDeleteStart.locationBasedOnLength[0], deleteStartIndex-1, "from delete Before when start != end", false);
                                            //var segBefore = that.constructSegment(effectedSegmentOfDeleteStart.segmentID.author, strBefore, that.currentSegID, effectedSegmentOfDeleteStart.segmentID.segID, 0, that.revID,effectedSegmentOfDeleteStart.locationBasedOnLength[0], deleteStartIndex-1, "from delete Before when start != end within segment", false);
                                       
                                        }
                                        result.insert(segBefore, deleteStartSegmentLocation);
                                    }
                                }

                            }

                            else{ // delete more than one segment (across segment)
                                //console.log("CHECK IF ENTER");
                                var strInBelongToDeleteStart = effectedSegmentOfDeleteStart.segmentID.segStr;
                                strInBelongToDeleteStart = strInBelongToDeleteStart.substring(0, deleteStartIndex-effectedSegmentOfDeleteStart.locationBasedOnLength[0]);

                                var strInBelongToDeleteEnd = effectedSegmentOfDeleteEnd.segmentID.segStr;
                                if (that.currentSegID === 181){
                                    console.log(escape(strInBelongToDeleteEnd));
                                }   
                                strInBelongToDeleteEnd = strInBelongToDeleteEnd.substring(deleteEndIndex- effectedSegmentOfDeleteEnd.locationBasedOnLength[0]+1);
                                if (that.currentSegID === 181){
                                    console.log(deleteEndIndex);
                                    console.log(effectedSegmentOfDeleteEnd.locationBasedOnLength[0]);

                                    console.log(escape(strInBelongToDeleteEnd));
                                }       
                                result.delete(deleteStartSegmentLocation, deleteEndSegmentLocation);

                                if (strInBelongToDeleteEnd.length > 0){
                                    that.currentSegID += 1;
                            
                                    if (effectedSegmentOfDeleteEnd.segmentID.permanent === true){
                                        if (that.currentSegID === 182){
                                            console.log("break point 7");
                                            console.log(previousType);
                                        }       
                                        var segAfter = that.constructSegment(effectedSegmentOfDeleteEnd.segmentID.author, strInBelongToDeleteEnd, that.currentSegID, effectedSegmentOfDeleteEnd.segmentID.segID, deleteEndIndex- effectedSegmentOfDeleteEnd.locationBasedOnLength[0]+1 , that.revID, deleteEndIndex+1, effectedSegmentOfDeleteEnd.locationBasedOnLength[1], "from delete AFTER when start != end", false);
                                     }
                                    else{
                                        var segAfter = that.constructSegment(effectedSegmentOfDeleteEnd.segmentID.author, strInBelongToDeleteEnd, that.currentSegID, effectedSegmentOfDeleteEnd.segmentID.parentSegID, deleteEndIndex- effectedSegmentOfDeleteEnd.locationBasedOnLength[0]+1 + effectedSegmentOfDeleteEnd.segmentID.offset, that.revID, deleteEndIndex+1, effectedSegmentOfDeleteEnd.locationBasedOnLength[1], "from delete AFTER when start != end", false);
                                       // var segAfter = that.constructSegment(effectedSegmentOfDeleteEnd.segmentID.author, strInBelongToDeleteEnd, that.currentSegID, effectedSegmentOfDeleteEnd.segmentID.segID, deleteEndIndex- effectedSegmentOfDeleteEnd.locationBasedOnLength[0]+1 , that.revID, deleteEndIndex+1, effectedSegmentOfDeleteEnd.locationBasedOnLength[1], "from delete AFTER when start != end", false);
                                   
                                    }
                                    result.insert(segAfter,deleteStartSegmentLocation);
                                }

                                if (strInBelongToDeleteStart.length > 0){
                                    that.currentSegID += 1;
                                    if (that.currentSegID === 182){
                                        console.log("break point 8");
                                    }                                   
                                    if (effectedSegmentOfDeleteStart.segmentID.permanent === true){
                                        var segBefore = that.constructSegment(effectedSegmentOfDeleteStart.segmentID.author, strInBelongToDeleteStart, that.currentSegID, effectedSegmentOfDeleteStart.segmentID.segID, 0, that.revID,effectedSegmentOfDeleteStart.locationBasedOnLength[0], deleteStartIndex-1, "from delete Before when start != end", false);
                                     }
                                   else {
                                        var segBefore = that.constructSegment(effectedSegmentOfDeleteStart.segmentID.author, strInBelongToDeleteStart, that.currentSegID, effectedSegmentOfDeleteStart.segmentID.parentSegID, effectedSegmentOfDeleteStart.segmentID.offset, that.revID,effectedSegmentOfDeleteStart.locationBasedOnLength[0], deleteStartIndex-1, "from delete Before when start != end", false);
                                       // var segBefore = that.constructSegment(effectedSegmentOfDeleteStart.segmentID.author, strInBelongToDeleteStart, that.currentSegID, effectedSegmentOfDeleteStart.segmentID.segID, 0, that.revID,effectedSegmentOfDeleteStart.locationBasedOnLength[0], deleteStartIndex-1, "from delete Before when start != end", false);

                                    
                                    }

                                    result.insert(segBefore,deleteStartSegmentLocation);
                                }





                            };
                        };

                        return result;

                    },



                    buildSegmentsForOneRevision: function(segmentsArray, authors){
                        var segments = [];
                        var counter = 0;
                        var that = this;


                        _.each(segmentsArray, function(eachSegment){

                            var currentAuthor = _.find(authors, function(eachAuthor) {
                                return eachAuthor.id === eachSegment.author;
                            });
                            if (currentAuthor === undefined){
                                var authorColor = "#7F7F7F";

                            }
                            if (currentAuthor != undefined){
                                var authorColor = currentAuthor.color;
                            }
                            
                            var segment = that.oneSegment(authorColor, eachSegment.segID, eachSegment.parentSegID, eachSegment.offset, eachSegment.segStr, eachSegment.segStr.length, eachSegment.revID);
                            segments.push(segment);
                        });


                        return segments;

                    },

                    // buildAuthorsSegment: function(chars, authors) {
                    //     var segments = [];
                    //     var tempAuthor = chars[0].aid;
                    //     var tempStr = '';
                    //     var counter = 0;

                    //     _.each(chars, function(element) {

                    //         if (element.aid != tempAuthor) {
                    //             var currentAuthor = _.find(authors, function(eachAuthor) {
                    //                 return eachAuthor.id === tempAuthor;
                    //             });

                    //             segments.push([currentAuthor, tempStr]);
                    //             tempStr = '';
                    //             tempAuthor = element.aid;
                    //         };

                    //         if (element.aid === tempAuthor) {
                    //             tempStr += element.s;
                    //             var currentAuthor = _.find(authors, function(eachAuthor) {
                    //                 return eachAuthor.id === tempAuthor;
                    //             });

                    //             // the if statement below handles the case when the revision is done by 1 author
                    //             if (counter === (chars.length - 1)) {
                    //                 segments.push([currentAuthor, tempStr]);
                    //             };
                    //         };
                    //         counter += 1;
                    //     });

                    //     return segments;


                    // },


                    calculateIntervalChangesIndex: function(logData, timeStamp) {
                        var indexArray = [];
                        // var stampIndex = function(index1, index2) {
                        //     return {
                        //         index1: index1,
                        //         index2: index2
                        //     };

                        // };

                        var reducedlogData = _.map(logData, function(val) {
                            return val[1];
                        });

                        _.each(timeStamp, function(val) {

                            indexArray.push(_.indexOf(reducedlogData, val));

                        });
                        return indexArray;
                    },



                });


            // Listen to message sent out from the View
            chrome.runtime.onMessage.addListener(
                function(request, sender, sendResponse) {
                    switch (request.msg) {
                        // If the message is 'changelog', run 'buildRevision'
                        case 'changelog':
                            window.docuviz.buildRevisions(request.vizType, request.docId, request.changelog, request.authors, request.revTimestamps, request.revAuthors);
                            break;

                        default:
                    }
                });

//}());
