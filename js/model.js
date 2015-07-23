;
(function() {
        'use strict';

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
        var authorviz = authorviz || {};

        $.extend(authorviz, {

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
                tempSegLength: 0,
                tempConstructSegmentsForCurrentRev: [],
                prevStr: '',
                pleaseContinue: true,
                pleaseContinue2: true,
                pleaseContinue3: true,
                pleaseContinue4: true,
                tempAuthorStr: '',
                firstInsertBeginIndex: null,
                endInsertBeginIndex: null,
                firstDeleteStartIndex: null,
                endDeleteEndIndex: null,
                currentSegID: 0,
                prevStr: '',
                firstRevisionSegments: [],
                segmentsArray: [],
                allSegmentsInCurrentRev: [],



                theOneSegment: function(author, type, index, endIndex, character){
                	return {
                		author: author,
                		type: type,
                		index: index,
                		endIndex: endIndex,
                		character: character
                	};
                },

                constructSegment: function(author, segStr, segID, parentSegID, offset, revID, beginIndex, endIndex, type) {
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
                        insertStartIndex = null,
                        deleteStartIndex = null,
                        deleteEndIndex = null;

                    // that.prevStr = that.str;

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
                                that.buildSegmentsWhenInsertForDocuviz(entry.s, insertStartIndex, authorId, that.firstRevisionSegments);
                                console.log("first insert after firstRevisionSegments");
                                console.log(that.allSegmentsInCurrentRev);
                                that.firstRevisionSegments = [];

                            }

                            else{
                                that.buildSegmentsWhenInsertForDocuviz(entry.s, insertStartIndex, authorId, that.allSegmentsInCurrentRev);

                            };


                            _.each(entry.s, function(character, index) {
                                var charObj = {
                                    s: character,
                                    aid: authorId
                                };
                                that.str.insert(charObj, (insertStartIndex - 1) + index);
                            });
                        }


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
                                that.deleteSegments(deleteStartIndex, deleteEndIndex, authorId, that.firstRevisionSegments);
                                console.log("first delete after firstRevisionSegments:");
                                console.log(that.allSegmentsInCurrentRev);
                                that.firstRevisionSegments = [];

                            }

                            else{
                                that.deleteSegments(deleteStartIndex, deleteEndIndex, authorId, that.allSegmentsInCurrentRev);

                            };

                           // that.deleteSegments(deleteStartIndex, deleteEndIndex, authorId, that.allSegmentsInCurrentRev);
                            
                        };
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

                       // if (vizType === 'docuviz') {
                        intervalChangesIndex = this.calculateIntervalChangesIndex(changelog, revTimestamps);
                        console.log(intervalChangesIndex);
                        //};

                        // ***
                        var prevAuthor = _.find(authors, function(eachAuthor) {
                            return eachAuthor.id === authors[0].id;
                        });


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



                                        //if (soFar <= 800){
                                        that.constructForDocuviz(command, authorId, currentRevID, that.currentSegID, segsInPrevRev, that.prevStr, that.pleaseContinue);
                                        //};
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
                                                    revData: revs
                                                }, function(response) {});
                                            });
                                        };
                                        //if (currentRevID < intervalChangesIndex.length) {
                                        if (currentRevID < 2) {

                                            // if (prevAuthor.id === currentAuthor.id) {
                                            //     that.pleaseContinue = true;
                                            //     prevAuthor = currentAuthor;
                                            // };

                                            // //handle author difference other than the first revision
                                            // if (prevAuthor.id != currentAuthor.id && currentRevID != 0) {
                                            //     that.currentSegID += 1;
                                            //     that.tempSegLength = 0;
                                            //     that.pleaseContinue = false;
                                                
                                            //     prevAuthor = currentAuthor;

                                            // };

                                            // // if previous author is different than the current author OR soFar has reaches the first cutting point
                                            // // in case the first revision has only one author contributed to it 
                                            if (prevAuthor.id != currentAuthor.id || soFar === intervalChangesIndex[0]) {
                                                //that.firstRevisionSegments.push(that.constructSegment(prevAuthor.id, that.renderToString(that.str), that.currentSegID, -1, 0, currentRevID, 0, that.str.length));
                                                //that.currentSegID += 1;
                                               // that.tempSegLength = 0;
                                               // that.firstInsertBeginIndex = null;
                                                //that.pleaseContinue = false;
                                               // prevAuthor = currentAuthor;
                                            };


                                            if (soFar === intervalChangesIndex[currentRevID]) {
                                                // if this is the first revision, first cutting point
                                                if (currentRevID === 0) {
                                                    var segments = that.buildAuthorsSegment(that.str, authors);
                                                    revs.push([that.str.length, revTimestamps[currentRevID], revAuthors[currentRevID], segments]);

                                                    that.firstRevisionSegments.push(that.constructSegment(prevAuthor.id, that.renderToString(that.str), that.currentSegID, -1, 0, currentRevID, 0, that.str.length));
                                                    that.currentSegID += 1;
                                                    revs2.push([that.str.length, revTimestamps[currentRevID], revAuthors[currentRevID], that.firstRevisionSegments]);

                                                    console.log(that.firstRevisionSegments);

                                                    //that.allSegmentsInCurrentRev = []; // clear all segments in the current Rev to prepare for the next Rev 
                                                    currentRevID += 1;
                                                    segsInPrevRev = revs2[0][3]; // set the segsInPrevRev to the first rev to prepare for the second one

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
                                                    var segments = that.buildAuthorsSegment(that.str, authors);
                                                    revs.push([that.str.length, revTimestamps[currentRevID], revAuthors[currentRevID], segments]);
                                                   // console.log("before group:");
                                                    //console.log(that.tempConstructSegmentsForCurrentRev);

                                                    //var newSegments = that.groupingSegments(that.tempConstructSegmentsForCurrentRev);
                                                    //console.log("after group:");
                                                   // console.log(newSegments);
                                                    // push rev into revs
                                                    revs2.push([that.str.length, revTimestamps[currentRevID], revAuthors[currentRevID], that.allSegmentsInCurrentRev]);

                                                    console.log("curent revID: " + currentRevID);
                                                    console.log(that.allSegmentsInCurrentRev);
                                                    //segsInPrevRev = that.tempConstructSegmentsForCurrentRev;
                                                  //  that.allSegmentsInCurrentRev = [];
                                                    //that.currentSegID = 0;
                                                    currentRevID += 1;
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


                    groupingSegments: function(currentSegments){
                        var result = [];
                        var tempStr = '';
                        var that = this;
                        //var segID = 0;

                        for (var i=0;i<currentSegments.length-1;i++){


                            if (currentSegments[i].author === currentSegments[i+1].author) {
                                tempStr += currentSegments[i].segLength;
                            }
                            else{
                                result.push(that.constructSegment(currentSegments[i].author, tempStr + currentSegments[i].segLength, currentSegments[i].segID, currentSegments[i].parentSegID, currentSegments[i].offset, currentSegments[i].revID,currentSegments[i].beginIndex,currentSegments[i].endIndex));
                                tempStr = '';
                               // segID+=1;
                            };

                        };
                        return result;                            

                    },



                    convertToLocationBased: function(segmentsArray){
                        var result = [];
                        var locationSoFar = 0;
                        var that = this;
                        for (var i = 0; i < segmentsArray.length; i++) {

                            if (i === 0) {
                                result.push(that.findParentSegmentHelper(segmentsArray[i].segStr.length, segmentsArray[i]));
                            } else {
                                result.push(that.findParentSegmentHelper((result[locationSoFar].locationBasedOnLength + segmentsArray[i].segStr.length + 1), segmentsArray[i]));
                                locationSoFar += 1;
                            };
                        };

                        return result;


                    },

                    totalLength: function(segmentsArray){
                        var total = 0;
                        _.each(segmentsArray, function(eachSegment){
                            total += eachSegment.segStr.length;
                        });

                        return total;
                    },


                    buildSegmentsWhenInsertForDocuviz: function(entry, startIndex, author, segmentsArray){
                        var that = this;
                        var segmentsBefore2 = that.buildSegmentsBefore(entry, startIndex, author, segmentsArray);

                        // have to do something here




                        // create new one: a combination of segmentbefore and all that is left


                    //    var segmentsAfter2 = that.buildSegmentsAfter(entry, startIndex, author, segmentsArray, segmentsBefore2);


                        that.allSegmentsInCurrentRev = [];

                      // console.log("before");
                       // console.log(segmentsBefore);
                       // console.log("after");
                       // console.log(segmentsAfter);

                        _.each(segmentsBefore2, function(eachSegment){
                            that.allSegmentsInCurrentRev.push(eachSegment);
                        });

                        // _.each(segmentsAfter2, function(eachSegment){
                        //     that.allSegmentsInCurrentRev.push(eachSegment);
                        // });    
                        
                       // that.allSegmentsInCurrentRev = that.groupingSegments(that.allSegmentsInCurrentRev);
                        console.log("---CURRENT REV SEGMENTS WHEN INSERT--------");
                        _.each(that.allSegmentsInCurrentRev, function(eachSegment){
                            console.log(eachSegment);
                        });    
                        console.log("---------------------------")
                    },



                    buildSegmentsBefore: function(entry,startIndex, author, segmentsArray){

                        var segmentsBefore = [];
                        var that = this;
                        var locationBased = that.convertToLocationBased(segmentsArray);
                        //var belongTo = null;


                       console.log("locationBased");
                       console.log(locationBased);

                        console.log("**** insertStartIndex:" + startIndex);
                        console.log("**** insert string:" + entry);

                        // for (var i = 0; i < locationBased.length-1; i++) {
                        //     if (startIndex >= locationBased[i].locationBasedOnLength && startIndex <= locationBased[i+1].locationBasedOnLength) {
                        //         segmentsBefore.push(locationBased[i].segmentID);
                        //     }

                        //     else{
                        //         segmentsBefore.push(locationBased[i+1].segmentID);
                        //         break;
                        //     };
                        // };


                        if (locationBased.length===1){
                            segmentsBefore.push(locationBased[0].segmentID);
                        }

                        else{

                            _.each(locationBased, function(eachSegment) {
                                if (eachSegment.locationBasedOnLength <= startIndex){
                                    //console.log("in each");
                                    console.log("startIndex  " + startIndex + " <= "  + eachSegment.locationBasedOnLength);
                                    segmentsBefore.push(eachSegment.segmentID);
                                };
                            });

                        };




                        console.log("segmentsBefore:   LEN: " + segmentsBefore.length);

                        _.each(segmentsBefore, function(eachSegment){
                            console.log(eachSegment);
                        });
                        
                        console.log("***");



                        // _.find(locationBased, function(eachSegment) {
                        //     if (startIndex <= eachSegment.locationBasedOnLength) {
                        //         //console.log("found belongTO");
                        //         belongTo = eachSegment.segmentID;
                        //     };
                        // }); 

                        if (segmentsBefore.length > 0){

                            var belongTo = segmentsBefore[segmentsBefore.length-1];


                            if (author === belongTo.author){
                                console.log("ENTER BELONGGGGGGGGG");
                                segmentsBefore.pop();
                                var strInBelongTo = belongTo.segStr;

                                strInBelongTo = strInBelongTo.insert((startIndex-that.totalLength(segmentsBefore)), entry);

                                console.log(strInBelongTo);

                                var newSegment = that.constructSegment(belongTo.author, strInBelongTo, belongTo.segID, belongTo.parentSegID, belongTo.offset, belongTo.revID,belongTo.beginIndex,startIndex, "from buildSegmentsBefore in author = belongTO.author");

                                segmentsBefore.push(newSegment);



                                var tempSegsArray = [];
                                var locationBased = that.convertToLocationBased(segmentsArray);


                                if (locationBased.length===1){

                                    // var strFromsegmentLeft = strInBelongTo.substring(startIndex-entry.length-1, strFromOld.length+entry.length-1);

                                    // console.log("LEFT substring from: " + (startIndex-entry.length-1));
                                    // console.log("LEFT substring UP TO: " + (strFromOld.length+entry.length-1));

                                    // if (strFromsegmentLeft.length > 0){
                                    //     var segmentLeft = that.constructSegment(belongTo.author, strFromsegmentLeft, that.currentSegID, -1, belongTo.offset, belongTo.revID, startIndex, startIndex+1, "new LEFT segments before when length === 0");

                                    //     segmentsBefore.push(segmentLeft);
                                    // };

                                    var strInBelongTo2 = locationBased[0].segmentID.segStr;
                                    var strFromOld2 = strInBelongTo2.substring(startIndex-1, strInBelongTo.length);

                                    var newSegment = that.constructSegment(belongTo.author, strFromOld2, belongTo.segID, belongTo.parentSegID, belongTo.offset, belongTo.revID,0,0,"from buildSegmentsAfter when length === 0 ");

                                    segmentsBefore.push(newSegment);



                                }

                                else{

                                    // var strInBelongTo3 = locationBased[0].segmentID.segStr;

                                    // var strFromsegmentLeft = strInBelongTo3.substring(startIndex-entry.length-1, strFromOld.length+entry.length-1);

                                    // console.log("LEFT substring from: " + (startIndex-entry.length-1));
                                    // console.log("LEFT substring UP TO: " + (strFromOld.length+entry.length-1));

                                    // if (strFromsegmentLeft.length > 0){
                                    //     var segmentLeft = that.constructSegment(belongTo.author, strFromsegmentLeft, that.currentSegID, -1, belongTo.offset, belongTo.revID, startIndex, startIndex+1, "new LEFT segments before when length === 0");

                                    //     segmentsBefore.push(segmentLeft);
                                    // };


                                    console.log("ENTER ELSE");
                                    _.each(locationBased, function(eachSegment) {
                                        if (eachSegment.locationBasedOnLength >= startIndex+entry.length) {
                                            segmentsBefore.push(eachSegment.segmentID);
                                        };
                                    }); 

                                };

                            }

                            else if (author != belongTo.author){

                                //console.log("enter author != ");
                                segmentsBefore.pop();

                                var strInBelongTo = belongTo.segStr;


                                if (segmentsBefore.length === 0){


                                    var strFromOld = strInBelongTo.substring(0, startIndex-1);

                                    console.log("strFromOld after SUB: ");
                                    console.log(strFromOld);

                                    var oldSegment = that.constructSegment(belongTo.author, strFromOld, belongTo.currentSegID, belongTo.parentSegID, belongTo.offset, belongTo.revID, 0,startIndex-1,"from buildSegmentsBefore in segmentsBefore.length === 0");

                                    segmentsBefore.push(oldSegment);

                                    that.currentSegID += 1
                                    var newSegment = that.constructSegment(author, entry, that.currentSegID, -1, belongTo.offset, belongTo.revID, startIndex, startIndex+1, "new before segmentsbe when length === 0");

                                    segmentsBefore.push(newSegment);

                                    // MAY BE PUSH SEGMENT AFTER HERE:


                                    var tempSegsArray = [];
                                    var locationBased = that.convertToLocationBased(segmentsArray);


                                    if (locationBased.length===1){

                                        // var strFromsegmentLeft = strInBelongTo.substring(startIndex-entry.length-1, strFromOld.length+entry.length-1);

                                        // console.log("LEFT substring from: " + (startIndex-entry.length-1));
                                        // console.log("LEFT substring UP TO: " + (strFromOld.length+entry.length-1));

                                        // if (strFromsegmentLeft.length > 0){
                                        //     var segmentLeft = that.constructSegment(belongTo.author, strFromsegmentLeft, that.currentSegID, -1, belongTo.offset, belongTo.revID, startIndex, startIndex+1, "new LEFT segments before when length === 0");

                                        //     segmentsBefore.push(segmentLeft);
                                        // };

                                        var strInBelongTo2 = locationBased[0].segmentID.segStr;
                                        var strFromOld2 = strInBelongTo2.substring(startIndex-1, strInBelongTo.length);

                                        var newSegment = that.constructSegment(belongTo.author, strFromOld2, belongTo.segID, belongTo.parentSegID, belongTo.offset, belongTo.revID,0,0,"from buildSegmentsAfter when length === 0 ");

                                        segmentsBefore.push(newSegment);



                                    }

                                    else{

                                        var strInBelongTo3 = locationBased[0].segmentID.segStr;

                                        var strFromsegmentLeft = strInBelongTo3.substring(startIndex-entry.length-1, strFromOld.length+entry.length-1);

                                        console.log("LEFT substring from: " + (startIndex-entry.length-1));
                                        console.log("LEFT substring UP TO: " + (strFromOld.length+entry.length-1));

                                        if (strFromsegmentLeft.length > 0){
                                            var segmentLeft = that.constructSegment(belongTo.author, strFromsegmentLeft, that.currentSegID, -1, belongTo.offset, belongTo.revID, startIndex, startIndex+1, "new LEFT segments before when length === 0");

                                            segmentsBefore.push(segmentLeft);
                                        };


                                        console.log("ENTER ELSE");
                                        _.each(locationBased, function(eachSegment) {
                                            if (eachSegment.locationBasedOnLength >= startIndex+entry.length) {
                                                segmentsBefore.push(eachSegment.segmentID);
                                            };
                                        }); 

                                    };





                                    // var strFromsegmentLeft = strInBelongTo.substring(startIndex-entry.length-1, strFromOld.length+entry.length-1);

                                    // console.log("LEFT substring from: " + (startIndex-entry.length-1));
                                    // console.log("LEFT substring UP TO: " + (strFromOld.length+entry.length-1));



                                    // var segmentLeft = that.constructSegment(belongTo.author, strFromsegmentLeft, that.currentSegID, -1, belongTo.offset, belongTo.revID, startIndex, startIndex+1, "new LEFT segments before when length === 0");

                                    // segmentsBefore.push(segmentLeft);

                                }


                                else { // WHEN SEGMENTBEFORE.LENGTH > 0 AFTER POP when AUTHOR != BELONGTO.AUTHOR


                                    console.log("---------ENTER ELSE-------");
                                     console.log("BELONG TO:");
                                     console.log(belongTo);
                                    

                                    console.log("TOTAL LENTH BEFORE: " + that.totalLength(segmentsBefore));



                                   // console.log("STR IN BELONG TO: " + strInBelongTo);


                                    var strFromOld = strInBelongTo.substring(0, startIndex-that.totalLength(segmentsBefore)+1);
                                    console.log("substring from: 0");
                                    console.log("substring UP TO: " + (startIndex-that.totalLength(segmentsBefore)+1));
                                    console.log("strFromOld after SUB: ");
                                    console.log(strFromOld);


                                    //var strFromOld = strInBelongTo.substring(that.totalLength(segmentsBefore), startIndex-that.totalLength(segmentsBefore));
                                    //console.log(strFromOld.length);
                                   // console.log(strFromOld);



                                    var oldSegment = that.constructSegment(belongTo.author, strFromOld, belongTo.currentSegID, belongTo.parentSegID, belongTo.offset, belongTo.revID, 0,0, "from buildSegmentsBefore in else");

                                    segmentsBefore.push(oldSegment);




                                    that.currentSegID += 1
                                    newSegment = that.constructSegment(author, entry, that.currentSegID, -1, belongTo.offset, belongTo.revID,startIndex,startIndex+1, "from buildSegmentsBefore in Else newSegment");
                                    segmentsBefore.push(newSegment);    



                                    // DOING SOMETHING HERE:


                                    var tempSegsArray = [];
                                    var locationBased = that.convertToLocationBased(segmentsArray);


                                    if (locationBased.length===1){

                                        // var strFromsegmentLeft = strInBelongTo.substring(startIndex-entry.length-1, strFromOld.length+entry.length-1);

                                        // console.log("LEFT substring from: " + (startIndex-entry.length-1));
                                        // console.log("LEFT substring UP TO: " + (strFromOld.length+entry.length-1));

                                        // if (strFromsegmentLeft.length > 0){
                                        //     var segmentLeft = that.constructSegment(belongTo.author, strFromsegmentLeft, that.currentSegID, -1, belongTo.offset, belongTo.revID, startIndex, startIndex+1, "new LEFT segments before when length === 0");

                                        //     segmentsBefore.push(segmentLeft);
                                        // };

                                        var strInBelongTo2 = locationBased[0].segmentID.segStr;
                                        var strFromOld2 = strInBelongTo2.substring(startIndex-1, strInBelongTo.length);

                                        var newSegment = that.constructSegment(belongTo.author, strFromOld2, belongTo.segID, belongTo.parentSegID, belongTo.offset, belongTo.revID,0,0,"from buildSegmentsAfter when length === 0 ");

                                        segmentsBefore.push(newSegment);



                                    }

                                    else{

                                        var strInBelongTo3 = locationBased[0].segmentID.segStr;

                                        var strFromsegmentLeft = strInBelongTo3.substring(startIndex-entry.length-1, strFromOld.length+entry.length-1);

                                        console.log("LEFT substring from: " + (startIndex-entry.length-1));
                                        console.log("LEFT substring UP TO: " + (strFromOld.length+entry.length-1));

                                        if (strFromsegmentLeft.length > 0){
                                            var segmentLeft = that.constructSegment(belongTo.author, strFromsegmentLeft, that.currentSegID, -1, belongTo.offset, belongTo.revID, startIndex, startIndex+1, "new LEFT segments before when length === 0");

                                            segmentsBefore.push(segmentLeft);
                                        };


                                        console.log("ENTER ELSE");
                                        _.each(locationBased, function(eachSegment) {
                                            if (eachSegment.locationBasedOnLength >= startIndex+entry.length) {
                                                segmentsBefore.push(eachSegment.segmentID);
                                            };
                                        }); 

                                    };
                                                



                                };

                            };

                        }

                        else{

                            segmentsBefore = [];
                        };


                        console.log("!!!!!!!!!!!!!");
                        console.log("SEGMENT RIGHT BEFORE RIGHT BEFORE AFTER");
                        _.each(segmentsBefore, function(eachSegment){
                            console.log(eachSegment);
                        });
                        console.log("!!!!!!!!*********!!!!")


                        return segmentsBefore;
                        
                    },


                    buildSegmentsAfter: function(entry,startIndex, author, segmentsArray, segmentsBefore){

                        var segmentsAfter = [];
                        var that = this;
                        var locationBased = that.convertToLocationBased(segmentsArray);




                       console.log("AFTER locationBased");
                       console.log(locationBased);
                       console.log("^^^^^^^^^^^^^^^^^^^^")

                        _.each(locationBased, function(eachSegment) {
                            if (eachSegment.locationBasedOnLength >= startIndex+entry.length) {
                                segmentsAfter.push(eachSegment.segmentID);
                            };
                        }); 




                        // _.find(locationBased, function(eachSegment) {
                        //     if (eachSegment.locationBasedOnLength >= startIndex) {
                        //         var belongTo = eachSegment.segmentID;
                        //     };
                        // }); 

                        console.log("segmentsAfter");
                        _.each(segmentsAfter, function(eachSegment){
                            console.log(eachSegment);
                        });
                        console.log("************")

                        if (segmentsAfter.length > 0){
                            console.log("segmentsAfter BELONG TO:");

                            console.log(segmentsAfter[0]);

                            console.log("*******--------******")
                            // find the segments that the current insert index is belong to
                            var belongTo = segmentsAfter[0];


                            if (author === belongTo.author){
                                segmentsAfter.shift(); // remove the first element of the array because the author is the same, we handle it in Before
                                console.log("AUTHOR ===== BELONGTO.AUTHOR");
                            }

                            else if (author != belongTo.author){

                                segmentsAfter.shift(); // remove the first element, substring and then push to the first again.


                                if (segmentsAfter.length === 0){
                                    var strInBelongTo = belongTo.segStr;
                                    var strFromOld = strInBelongTo.substring(startIndex-1, strInBelongTo.length);

                                    var newSegment = that.constructSegment(belongTo.author, strFromOld, belongTo.segID, belongTo.parentSegID, belongTo.offset, belongTo.revID,0,0,"from buildSegmentsAfter when length === 0 ");

                                    segmentsAfter.unshift(newSegment);
                                }

                                else{

                                    var strInBelongTo = belongTo.segStr;

                                    //var strFromOld = strInBelongTo.substring(startIndex+1, locationBased.slice(-1)[0].locationBasedOnLength);

                                    var strFromOld = strInBelongTo.substring((startIndex-that.totalLength(segmentsBefore)+1), strInBelongTo.length);

                                    var newSegment = that.constructSegment(belongTo.author, strFromOld, belongTo.segID, belongTo.parentSegID, belongTo.offset, belongTo.revID,0,0,"from buildSegmentsAfter");

                                    segmentsAfter.unshift(newSegment);


                                };
                            



                            };

                        }

                        else{
                            segmentsAfter = [];
                        }

                        console.log("!!!!!!!!!!!!!");
                        console.log("SEGMENT AFTER AFTER FINISH");
                        console.log(segmentsAfter);
                        console.log("!!!!!!!!!!!!")


                        return segmentsAfter;

                    },

                    deleteSegments: function(deleteStartIndex, deleteEndIndex, author, segmentsArray){
                        var segmentsBefore = [];
                        var segmentsAfter = [];
                        var result = [];
                        var that = this;
                        var locationBased = that.convertToLocationBased(segmentsArray);


                        console.log("locationBased");
                        console.log(locationBased);

                        console.log("deleteStartIndex" + deleteStartIndex);
                        console.log("deleteEndIndex" + deleteEndIndex);


                        if (deleteStartIndex===deleteEndIndex){


                            console.log("WHEN deleteStartIndex ==== deleteEndIndex");
                            _.each(locationBased, function(eachSegment) {
                                if (eachSegment.locationBasedOnLength <= deleteStartIndex) {
                                    segmentsBefore.push(eachSegment.segmentID);
                                };
                            }); 

                             _.each(locationBased, function(eachSegment) {
                                if (eachSegment.locationBasedOnLength >= deleteEndIndex) {

                                    segmentsAfter.push(eachSegment.segmentID);
                                };
                            });   


                            that.allSegmentsInCurrentRev = [];

                            var belongToDeleteStartIndex = segmentsBefore[segmentsBefore.length-1];
                            var belongToDeleteEndIndex = segmentsAfter[0];



                            console.log("BELONG TO deleteStartIndex:");
                            console.log(belongToDeleteStartIndex);
                            console.log("BELONG TO deleteEndIndex");
                            console.log(belongToDeleteEndIndex);


                            if (segmentsBefore.length > 0){
                                segmentsBefore.pop();
                                var strFromOld = belongToDeleteStartIndex.segStr;
                                strFromOld = strFromOld.substring(0, deleteStartIndex-that.totalLength(segmentsBefore)-1);

                                var oldSegment = that.constructSegment(belongToDeleteStartIndex.author, strFromOld, belongToDeleteStartIndex.currentSegID, belongToDeleteStartIndex.parentSegID, belongToDeleteStartIndex.offset, belongToDeleteStartIndex.revID,0,0, "from deleteSegments");

                                segmentsBefore.push(oldSegment);                                                 

                                _.each(segmentsBefore, function(eachSegment){
                                    that.allSegmentsInCurrentRev.push(eachSegment);
                                });
                            };                              


                            if (segmentsAfter.length > 0){

                                //console.log("enter segmentsAfter > 0");
                                segmentsAfter.shift();
                                var strFromOld = belongToDeleteEndIndex.segStr;
                                console.log("STRING FROM OLD: " + strFromOld);
                                strFromOld = strFromOld.substring(0, deleteStartIndex-that.totalLength(segmentsBefore)-1)+strFromOld.substring(deleteStartIndex-that.totalLength(segmentsBefore),strFromOld.length);


                                console.log("DELETE FROM: " + (deleteStartIndex-that.totalLength(segmentsBefore)-1));
                                console.log("DELETE TO: " + (deleteStartIndex-that.totalLength(segmentsBefore)));
                                //strFromOld = strFromOld.substring(deleteEndIndex-that.totalLength(segmentsBefore), strFromOld.length);
                                //strFromOld = strFromOld.substring(0, strFromOld.length-1);
                                console.log("AFTER DELETE: " + strFromOld)
                                var newSegment = that.constructSegment(belongToDeleteEndIndex.author, strFromOld, belongToDeleteEndIndex.currentSegID, belongToDeleteEndIndex.parentSegID, belongToDeleteEndIndex.offset, belongToDeleteEndIndex.revID,deleteEndIndex,belongToDeleteEndIndex.segStr.length, "from deleteSegments AFTER");


                                segmentsAfter.unshift(newSegment);

                                _.each(segmentsAfter, function(eachSegment){
                                    that.allSegmentsInCurrentRev.push(eachSegment);

                                 });





                                console.log("---CURRENT REV SEGMENTS WHEN DELETE--------");
                                console.log(that.allSegmentsInCurrentRev);
                                console.log("---------------------------")
                            };


                        }




                        else{

                            _.each(locationBased, function(eachSegment) {
                                if (eachSegment.locationBasedOnLength <= deleteStartIndex) {
                                    segmentsBefore.push(eachSegment.segmentID);
                                };
                            }); 


                            // console.log("segmentsBefore");
                            // console.log(segmentsBefore);

                             _.each(locationBased, function(eachSegment) {
                                if (eachSegment.locationBasedOnLength >= deleteEndIndex) {

                                    segmentsAfter.push(eachSegment.segmentID);
                                };
                            });   
                            
                            //console.log("segmentsAfter");
                            //console.log(segmentsAfter);

                            that.allSegmentsInCurrentRev = [];

                            var belongToDeleteStartIndex = segmentsBefore[segmentsBefore.length-1];
                            var belongToDeleteEndIndex = segmentsAfter[0];



                            console.log("BELONG TO deleteStartIndex:");
                            console.log(belongToDeleteStartIndex);
                            console.log("BELONG TO deleteEndIndex");
                            console.log(belongToDeleteEndIndex);


                            if (segmentsBefore.length > 0){
                                segmentsBefore.pop();
                                var strFromOld = belongToDeleteStartIndex.segStr;
                                strFromOld = strFromOld.substring(0, deleteStartIndex-that.totalLength(segmentsBefore)-1);

                                var oldSegment = that.constructSegment(belongToDeleteStartIndex.author, strFromOld, belongToDeleteStartIndex.currentSegID, belongToDeleteStartIndex.parentSegID, belongToDeleteStartIndex.offset, belongToDeleteStartIndex.revID,0,0, "from deleteSegments");

                                segmentsBefore.push(oldSegment);                                                 

                                _.each(segmentsBefore, function(eachSegment){
                                    that.allSegmentsInCurrentRev.push(eachSegment);
                                });



                            };    

                            if (segmentsAfter.length > 0){

                                //console.log("enter segmentsAfter > 0");
                                segmentsAfter.shift();
                                var strFromOld = belongToDeleteEndIndex.segStr;




                                console.log("STRING FROM OLD: " + strFromOld);

                                console.log("DELETE FROM: " + (deleteEndIndex-that.totalLength(segmentsBefore)));
                                console.log("DELETE TO: " + (strFromOld.length));
                                strFromOld = strFromOld.substring(deleteEndIndex-that.totalLength(segmentsBefore), strFromOld.length);
                                //strFromOld = strFromOld.substring(0, strFromOld.length-1);
                                console.log("AFTER DELETE: " + strFromOld)
                                var newSegment = that.constructSegment(belongToDeleteEndIndex.author, strFromOld, belongToDeleteEndIndex.currentSegID, belongToDeleteEndIndex.parentSegID, belongToDeleteEndIndex.offset, belongToDeleteEndIndex.revID,deleteEndIndex,belongToDeleteEndIndex.segStr.length, "from deleteSegments AFTER");


                                segmentsAfter.unshift(newSegment);

                                _.each(segmentsAfter, function(eachSegment){
                                    that.allSegmentsInCurrentRev.push(eachSegment);

                                 });





                                console.log("---CURRENT REV SEGMENTS WHEN DELETE--------");
                                console.log(that.allSegmentsInCurrentRev);
                                console.log("---------------------------")
                            };






                        };



                    },



                    findParentSegment: function(startIndex, segsInPrevRev) {
                            var locationSoFar = 0,
                            	that = this,
                                findParentSegmentHelperArray = [],
                                parentSegmentID = null;

                            // this for loop purpose is to create a different kind of array. For example, the length of each segment in one rev is:
                            // [200,100,300,50] . So we can convert this to: [200,300,600,650]. This can help because if the ibi is 250 we can know right away that
                            // it belong to segment at index 1. ibi: 350 will belong to segment at index 2. The calculation is in the for loop and find function.
                            
                            for (var i = 0; i < segsInPrevRev.length; i++) {

                                if (i === 0) {
                                    findParentSegmentHelperArray.push(that.findParentSegmentHelper(segsInPrevRev[i].segLength.length, segsInPrevRev[i].segID));
                                } else {
                                    findParentSegmentHelperArray.push(that.findParentSegmentHelper((findParentSegmentHelperArray[locationSoFar].locationBasedOnLength + segsInPrevRev[i].segLength.length), segsInPrevRev[i].segID));
                                    locationSoFar += 1;
                                };
                            };

                            _.find(findParentSegmentHelperArray, function(eachSegment) {

                                if (startIndex <= eachSegment.locationBasedOnLength) {
                                    parentSegmentID = eachSegment.segmentID;
                                } else {
                                    parentSegmentID = -1;
                                };
                            }); 
                            
                            return parentSegmentID;                  	

                    },

                    buildAuthorsSegment: function(chars, authors) {
                        var segments = [];
                        var tempAuthor = chars[0].aid;
                        var tempStr = '';
                        var counter = 0;

                        _.each(chars, function(element) {

                            if (element.aid != tempAuthor) {
                                var currentAuthor = _.find(authors, function(eachAuthor) {
                                    return eachAuthor.id === tempAuthor;
                                });

                                segments.push([currentAuthor, tempStr]);
                                tempStr = '';
                                tempAuthor = element.aid;
                            };

                            if (element.aid === tempAuthor) {
                                tempStr += element.s;
                                var currentAuthor = _.find(authors, function(eachAuthor) {
                                    return eachAuthor.id === tempAuthor;
                                });

                                // the if statement below handles the case when the revision is done by 1 author
                                if (counter === (chars.length - 1)) {
                                    segments.push([currentAuthor, tempStr]);
                                };
                            };
                            counter += 1;
                        });

                        return segments;


                    },


                    calculateIntervalChangesIndex: function(logData, timeStamp) {
                        var indexArray = [];
                        var stampIndex = function(index1, index2) {
                            return {
                                index1: index1,
                                index2: index2
                            };

                        };

                        var reducedlogData = _.map(logData, function(val) {
                            return val[1];
                        });

                        _.each(timeStamp, function(val) {

                            indexArray.push(_.indexOf(reducedlogData, val.timestamp2));

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
                            authorviz.buildRevisions(request.vizType, request.docId, request.changelog, request.authors, request.revTimestamps, request.revAuthors);
                            break;

                        default:
                    }
                });

        }());
