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


String.prototype.insert = function(index, string) {
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


    renderToString: function(chars) {
        return _.reduce(chars, function(memo, obj) {
            if (obj.s === "\n") {
                return memo + "\n";
            } else {
                return memo + obj.s;
            }

        }, '');
    },


    allSegmentsInCurrentRev: [],
    firstRevisionSegments: [],
    segmentsArray: [],
    revID: 0,
    currentSegID: 0,

    // oneSegment is the actual segment that will be passed to the View, it only ontains the information needed
    // to draw Docuviz 
    oneSegment: function(authorColor, segID, parentSegID, offset, segStr, segLength, revID) {
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

    // constructSegment is a segment object that has more information for constructing inside model.js 
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


    // need to change this to findBeginAndEndIndexOfSegsHelper
    findBeginAndEndIndexesOfSegsHelper: function(locationBasedOnLength, segment) {
        return {
            locationBasedOnLength: locationBasedOnLength, // [begin index of seg, end index of seg]
            segment: segment // "Construct Segment" object
        };
    },


    constructForDocuviz: function(entry, authorId, currentRevID, currentSegID, segsInFirstRev) {
        var that = this,
            type = entry.ty,
            insertStartIndex = null,
            deleteStartIndex = null,
            deleteEndIndex = null;

        if (type === 'mlti') {
            _.each(entry.mts, function(ent) {
                that.constructForDocuviz(ent, authorId, currentRevID, currentSegID, segsInFirstRev);
            });
        } else if (type === 'rplc') {
            _.each(entry.snapshot, function(ent) {
                that.constructForDocuviz(ent, authorId, currentRevID, currentSegID, segsInFirstRev);
            });

        } else if (type === 'rvrt') {
            that.str = [];
            that.allSegmentsInCurrentRev = [];
            _.each(entry.snapshot, function(ent) {
                that.constructForDocuviz(ent, authorId, currentRevID, currentSegID, segsInFirstRev);
            });

        } else if (type === 'is' || type === 'iss') {
            // the first rev
            if (segsInFirstRev === null) {
                insertStartIndex = entry.ibi;
                _.each(entry.s, function(character, index) {
                    var charObj = {
                        s: character,
                        aid: authorId
                    };

                    that.str.insert(charObj, (insertStartIndex - 1) + index);
                });

            }

            // calculating the second and following revs
            else {

                insertStartIndex = entry.ibi;

                if (that.firstRevisionSegments.length > 0) {
                    that.allSegmentsInCurrentRev = that.buildSegmentsWhenInsert(entry.s, insertStartIndex, authorId, that.firstRevisionSegments);
                    that.firstRevisionSegments = [];

                } else {
                    that.allSegmentsInCurrentRev = that.buildSegmentsWhenInsert(entry.s, insertStartIndex, authorId, that.allSegmentsInCurrentRev);

                };


                _.each(entry.s, function(character, index) {
                    var charObj = {
                        s: character,
                        aid: authorId
                    };
                    that.str.insert(charObj, (insertStartIndex - 1) + index);
                });



            }



        } else if (type === 'ds' || type === 'dss') {
            // the first rev
            if (segsInFirstRev === null) {
                deleteStartIndex = entry.si;
                deleteEndIndex = entry.ei;
                this.str.delete(deleteStartIndex - 1, deleteEndIndex - 1);

            }

            // calculating the second and following revs, using the segs in previous rev
            else {

                deleteStartIndex = entry.si;
                deleteEndIndex = entry.ei;
                this.str.delete(deleteStartIndex - 1, deleteEndIndex - 1);



                if (that.firstRevisionSegments.length > 0) {
                    that.allSegmentsInCurrentRev = that.buildSegmentsWhenDelete(deleteStartIndex, deleteEndIndex, authorId, that.firstRevisionSegments);
                    that.firstRevisionSegments = [];

                } else {
                    that.allSegmentsInCurrentRev = that.buildSegmentsWhenDelete(deleteStartIndex, deleteEndIndex, authorId, that.allSegmentsInCurrentRev);
                }

            }

        }

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
            currentRevID = 0,
            intervalChangesIndex = [],
            segsInFirstRev = null,
            differentAuthor = null;
        that.currentSegID = 0;
        that.revID = 0;

        intervalChangesIndex = this.calculateIntervalChangesIndex(changelog, revTimestamps);

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


                    that.constructForDocuviz(command, authorId, that.revID, that.currentSegID, segsInFirstRev);

                    // reaching the end of changelog
                    if (soFar === editCount) {
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
                    if (currentRevID < intervalChangesIndex.length) {

                        if (soFar === intervalChangesIndex[currentRevID] + 1) {
                            // if this is the first revision, at the first cutting point
                            if (currentRevID === 0) {
                                that.firstRevisionSegments.push(that.constructSegment(currentAuthor.id, that.renderToString(that.str), that.currentSegID, that.currentSegID, 0, that.revID, 0, that.str.length, 'type', true));
                                var segments = that.buildSegmentsForOneRevision(that.firstRevisionSegments, authors);
                                revs.push([that.str.length, revTimestamps[currentRevID], revAuthors[currentRevID], segments]);
                                currentRevID += 1;
                                that.revID += 1;
                                segsInFirstRev = revs[0][3]; // set the segsInFirstRev to the first rev to prepare for the second one
                            }

                            // Other cutting points
                            else {
                                var tempSegments = [];
                                var segLength = 0;

                                // change all segments'revID to the same revID
                                _.each(that.allSegmentsInCurrentRev, function(eachSegment) {
                                    eachSegment.revID = currentRevID;
                                    eachSegment.permanent = true;
                                    tempSegments.push(eachSegment);

                                });

                                that.allSegmentsInCurrentRev = tempSegments;

                                // convert every segments into oneSegment object:
                                var segments = that.buildSegmentsForOneRevision(that.allSegmentsInCurrentRev, authors);

                                revs.push([that.str.length, revTimestamps[currentRevID], revAuthors[currentRevID], segments]);

                                currentRevID += 1;
                                that.revID += 1;
                            };

                        } else {
                            // where we calculate the segments, but not pushing rev

                        };

                    };


                    // Callback lets async knows that the sequence is finished can it can start run another entry           
                    callBack();
                });
            });
        });
    },


    // this function takes the current segments array and return aan array of an
    // object that contains: {{[begin index of seg, endindex of seg],[segment]},...}
    findBeginAndEndIndexesOfSegs: function(segmentsArray) {
        var segsArray = [];
        var locationSoFar = 0;
        var that = this;
        for (var i = 0; i < segmentsArray.length; i++) {

            if (i === 0) {
                segsArray.push(that.findBeginAndEndIndexesOfSegsHelper([1, segmentsArray[i].segStr.length], segmentsArray[i]));
            } else {
                segsArray.push(that.findBeginAndEndIndexesOfSegsHelper([segsArray[locationSoFar].locationBasedOnLength[1] + 1, (segsArray[locationSoFar].locationBasedOnLength[1] + segmentsArray[i].segStr.length)], segmentsArray[i]));
                locationSoFar += 1;
            };
        };

        return segsArray;
    },



    buildSegmentsWhenInsert: function(entry, startIndex, author, segmentsArray) {

        var segmentsBefore = [];
        var segsArray = segmentsArray;
        var that = this;
        var locationBased = that.findBeginAndEndIndexesOfSegs(segmentsArray);


        var segmentLocation = 0;
        var effectedSegment = null;
        _.each(locationBased, function(eachSegment, index) {
            if (startIndex === eachSegment.locationBasedOnLength[0]) {
                if (index === 0) {
                    effectedSegment = eachSegment;
                    segmentLocation = index;
                } else {
                    if (locationBased[index - 1].segment.author === author) {
                        effectedSegment = locationBased[index - 1];
                        segmentLocation = index - 1;
                    } else if (author === eachSegment.segment.author) {
                        effectedSegment = eachSegment;
                        segmentLocation = index;
                    } else {
                        effectedSegment = eachSegment;
                        segmentLocation = index;
                    }
                }

            } else if (eachSegment.locationBasedOnLength[0] < startIndex && startIndex <= eachSegment.locationBasedOnLength[1]) {
                segmentLocation = index;
                effectedSegment = eachSegment;
            } else {}

        });
        if (effectedSegment === null) {
            that.currentSegID += 1;
            var currentSeg = that.constructSegment(author, entry, that.currentSegID, that.currentSegID, 0, that.revID, startIndex, startIndex + entry.length - 1, "middle part where author != prev author", false);

            segsArray.insert(currentSeg, locationBased.length);
        } else {

            if (author === effectedSegment.segment.author && (that.revID === effectedSegment.segment.revID)) {
                var strInBelongTo = effectedSegment.segment.segStr;
                strInBelongTo = strInBelongTo.insert(startIndex - effectedSegment.locationBasedOnLength[0], entry);
                segsArray[segmentLocation].segStr = strInBelongTo;
                segsArray[segmentLocation].permanent = false;

            } else { // when author != effectedSegment.segment.author
                var strInBelongTo = effectedSegment.segment.segStr;


                var strBeforeStartIndex = strInBelongTo.substring(0, startIndex - effectedSegment.locationBasedOnLength[0]);
                var strAfterStartIndex = strInBelongTo.substring(startIndex - effectedSegment.locationBasedOnLength[0]);

                if (strBeforeStartIndex.length > 0) {

                    segsArray.delete(segmentLocation, segmentLocation);

                    that.currentSegID += 1;

                    if (effectedSegment.segment.permanent === true) {
                        var segBefore = that.constructSegment(effectedSegment.segment.author, strBeforeStartIndex, that.currentSegID, effectedSegment.segment.segID, 0, that.revID, effectedSegment.locationBasedOnLength[0], startIndex - effectedSegment.locationBasedOnLength[0], "from buildSegment Before in author !=  segment author when permanent = true", false);
                    } else {
                        var segBefore = that.constructSegment(effectedSegment.segment.author, strBeforeStartIndex, that.currentSegID, effectedSegment.segment.parentSegID, effectedSegment.segment.offset, that.revID, effectedSegment.locationBasedOnLength[0], startIndex - effectedSegment.locationBasedOnLength[0], "from buildSegment Before in author !=  segment author when permanent = false", false);

                    }

                    segsArray.insert(segBefore, segmentLocation)
                    that.currentSegID += 1;


                    var currentSeg = that.constructSegment(author, entry, that.currentSegID, that.currentSegID, 0, that.revID, startIndex, startIndex + entry.length - 1, "middle part where author != prev author", false);

                    segsArray.insert(currentSeg, segmentLocation + 1);


                    if (strAfterStartIndex.length > 0) {
                        that.currentSegID += 1;

                        var offset = startIndex - effectedSegment.locationBasedOnLength[0];


                        if (effectedSegment.segment.permanent === true) {
                            var segAfter = that.constructSegment(effectedSegment.segment.author, strAfterStartIndex, that.currentSegID, effectedSegment.segment.segID, offset, that.revID, startIndex + entry.length, effectedSegment.locationBasedOnLength[1] + entry.length, "from buildSegment After in author !=  segment author when permanent = true", false);
                        } else {
                            var segAfter = that.constructSegment(effectedSegment.segment.author, strAfterStartIndex, that.currentSegID, effectedSegment.segment.parentSegID, offset + effectedSegment.segment.offset, that.revID, startIndex + entry.length, effectedSegment.locationBasedOnLength[1] + entry.length, "from buildSegment After in author !=  segment author when permanent = false", false);
                        }
                        segsArray.insert(segAfter, segmentLocation + 2);

                    };

                } else { // handle the case where before Str is blank
                    that.currentSegID += 1;
                    var currentSeg = that.constructSegment(author, entry, that.currentSegID, that.currentSegID, 0, that.revID, startIndex, startIndex + entry.length - 1, "middle part where author != prev author", false);

                    segsArray.insert(currentSeg, segmentLocation);

                };

            }

        }

        return segsArray;

    },


    buildSegmentsWhenDelete: function(deleteStartIndex, deleteEndIndex, author, segmentsArray) {
        var segsArray = segmentsArray;

        var that = this;
        var locationBased = that.findBeginAndEndIndexesOfSegs(segmentsArray);


        if (deleteStartIndex === deleteEndIndex) {

            var deleteSegmentLocation = 0;
            var effectedSegmentOfDelete = null;

            _.each(locationBased, function(eachSegment, index) {
                if (eachSegment.locationBasedOnLength[0] <= deleteStartIndex && deleteStartIndex <= eachSegment.locationBasedOnLength[1]) {
                    deleteSegmentLocation = index;
                    effectedSegmentOfDelete = eachSegment;
                }
            });


            var strInBelongTo = effectedSegmentOfDelete.segment.segStr;
            strInBelongTo = strInBelongTo.substring(0, deleteStartIndex - effectedSegmentOfDelete.locationBasedOnLength[0]) + strInBelongTo.substring(deleteStartIndex - effectedSegmentOfDelete.locationBasedOnLength[0] + 1);

            segsArray[deleteSegmentLocation].segStr = strInBelongTo;


        } else { // when deleteStartIndex != deleteEndIndex 

            var deleteStartSegmentLocation = 0;
            var effectedSegmentOfDeleteStart = null;
            var deleteEndSegmentLocation = 0;
            var effectedSegmentOfDeleteEnd = null;

            _.each(locationBased, function(eachSegment, index) {
                if (eachSegment.locationBasedOnLength[0] <= deleteStartIndex && deleteStartIndex <= eachSegment.locationBasedOnLength[1]) {
                    deleteStartSegmentLocation = index;
                    effectedSegmentOfDeleteStart = eachSegment;
                }
            });


            _.each(locationBased, function(eachSegment, index) {
                if (eachSegment.locationBasedOnLength[0] <= deleteEndIndex && deleteEndIndex <= eachSegment.locationBasedOnLength[1]) {
                    deleteEndSegmentLocation = index;
                    effectedSegmentOfDeleteEnd = eachSegment;
                }
            });


            if (deleteStartSegmentLocation === deleteEndSegmentLocation) { //within segment

                var strInBelongTo = effectedSegmentOfDeleteStart.segment.segStr;
                segsArray.delete(deleteStartSegmentLocation, deleteStartSegmentLocation);
                var strBefore = strInBelongTo.substring(0, deleteStartIndex - effectedSegmentOfDeleteStart.locationBasedOnLength[0]);
                var strAfter = strInBelongTo.substring(deleteEndIndex - effectedSegmentOfDeleteStart.locationBasedOnLength[0] + 1);

                if (strAfter.length > 0) {
                    that.currentSegID += 1;

                    if (effectedSegmentOfDeleteStart.segment.permanent === true) {
                        var segAfter = that.constructSegment(effectedSegmentOfDeleteStart.segment.author, strAfter, that.currentSegID, effectedSegmentOfDeleteStart.segment.segID, deleteEndIndex - effectedSegmentOfDeleteStart.locationBasedOnLength[0] + 1, that.revID, effectedSegmentOfDeleteStart.locationBasedOnLength[0], deleteStartIndex - 1, "from delete Before when start != end within segment", false);

                    } else {
                        var segAfter = that.constructSegment(effectedSegmentOfDeleteStart.segment.author, strAfter, that.currentSegID, effectedSegmentOfDeleteStart.segment.parentSegID, deleteEndIndex - effectedSegmentOfDeleteStart.locationBasedOnLength[0] + 1 + effectedSegmentOfDeleteStart.segment.offset, that.revID, effectedSegmentOfDeleteStart.locationBasedOnLength[0], deleteStartIndex - 1, "from delete Before when start != end", false);
                    }

                    segsArray.insert(segAfter, deleteStartSegmentLocation);
                }


                if (strBefore.length > 0) {
                    that.currentSegID += 1;
                    if (effectedSegmentOfDeleteStart.segment.permanent === true) {
                        var segBefore = that.constructSegment(effectedSegmentOfDeleteStart.segment.author, strBefore, that.currentSegID, effectedSegmentOfDeleteStart.segment.segID, 0, that.revID, effectedSegmentOfDeleteStart.locationBasedOnLength[0], deleteStartIndex - 1, "from delete Before when start != end within segment", false);

                    } else {
                        var segBefore = that.constructSegment(effectedSegmentOfDeleteStart.segment.author, strBefore, that.currentSegID, effectedSegmentOfDeleteStart.segment.parentSegID, effectedSegmentOfDeleteStart.segment.offset, that.revID, effectedSegmentOfDeleteStart.locationBasedOnLength[0], deleteStartIndex - 1, "from delete Before when start != end", false);

                    }
                    segsArray.insert(segBefore, deleteStartSegmentLocation);
                }

            } else { // delete more than one segment (across segment)                        
                var strInBelongToDeleteStart = effectedSegmentOfDeleteStart.segment.segStr;
                strInBelongToDeleteStart = strInBelongToDeleteStart.substring(0, deleteStartIndex - effectedSegmentOfDeleteStart.locationBasedOnLength[0]);

                var strInBelongToDeleteEnd = effectedSegmentOfDeleteEnd.segment.segStr;
                strInBelongToDeleteEnd = strInBelongToDeleteEnd.substring(deleteEndIndex - effectedSegmentOfDeleteEnd.locationBasedOnLength[0] + 1);

                segsArray.delete(deleteStartSegmentLocation, deleteEndSegmentLocation);

                if (strInBelongToDeleteEnd.length > 0) {
                    that.currentSegID += 1;

                    if (effectedSegmentOfDeleteEnd.segment.permanent === true) {
                        var segAfter = that.constructSegment(effectedSegmentOfDeleteEnd.segment.author, strInBelongToDeleteEnd, that.currentSegID, effectedSegmentOfDeleteEnd.segment.segID, deleteEndIndex - effectedSegmentOfDeleteEnd.locationBasedOnLength[0] + 1, that.revID, deleteEndIndex + 1, effectedSegmentOfDeleteEnd.locationBasedOnLength[1], "from delete AFTER when start != end", false);
                    } else {
                        var segAfter = that.constructSegment(effectedSegmentOfDeleteEnd.segment.author, strInBelongToDeleteEnd, that.currentSegID, effectedSegmentOfDeleteEnd.segment.parentSegID, deleteEndIndex - effectedSegmentOfDeleteEnd.locationBasedOnLength[0] + 1 + effectedSegmentOfDeleteEnd.segment.offset, that.revID, deleteEndIndex + 1, effectedSegmentOfDeleteEnd.locationBasedOnLength[1], "from delete AFTER when start != end", false);

                    }
                    segsArray.insert(segAfter, deleteStartSegmentLocation);
                }

                if (strInBelongToDeleteStart.length > 0) {
                    that.currentSegID += 1;

                    if (effectedSegmentOfDeleteStart.segment.permanent === true) {
                        var segBefore = that.constructSegment(effectedSegmentOfDeleteStart.segment.author, strInBelongToDeleteStart, that.currentSegID, effectedSegmentOfDeleteStart.segment.segID, 0, that.revID, effectedSegmentOfDeleteStart.locationBasedOnLength[0], deleteStartIndex - 1, "from delete Before when start != end", false);
                    } else {
                        var segBefore = that.constructSegment(effectedSegmentOfDeleteStart.segment.author, strInBelongToDeleteStart, that.currentSegID, effectedSegmentOfDeleteStart.segment.parentSegID, effectedSegmentOfDeleteStart.segment.offset, that.revID, effectedSegmentOfDeleteStart.locationBasedOnLength[0], deleteStartIndex - 1, "from delete Before when start != end", false);

                    }

                    segsArray.insert(segBefore, deleteStartSegmentLocation);
                }
            };
        };

        return segsArray;

    },



    buildSegmentsForOneRevision: function(segmentsArray, authors) {
        var segments = [];
        var counter = 0;
        var that = this;
        
        _.each(segmentsArray, function(eachSegment) {

            var currentAuthor = _.find(authors, function(eachAuthor) {
                return eachAuthor.id === eachSegment.author;
            });
            if (currentAuthor === undefined) {
                var authorColor = "#7F7F7F";

            }
            if (currentAuthor != undefined) {
                var authorColor = currentAuthor.color;
            }

            var segment = that.oneSegment(authorColor, eachSegment.segID, eachSegment.parentSegID, eachSegment.offset, eachSegment.segStr, eachSegment.segStr.length, eachSegment.revID);
            segments.push(segment);
        });

        return segments;

    },

    calculateIntervalChangesIndex: function(logData, timeStamp) {
        var indexArray = [];
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