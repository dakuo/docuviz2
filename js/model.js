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
                tempAuthorStr: '',
                firstInsertBeginIndex: null,
                endInsertBeginIndex: null,
                firstDeleteStartIndex: null,
                endDeleteEndIndex: null,
                currentSegID: 0,
                prevStr: '',
                theOne: [],


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
                        segLength: segStr,
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
                    } else if (type === 'is') {
                        // the first rev
                        if (segsInPrevRev === null) {
                            insertStartIndex = entry.ibi;
                            // if (pleaseContinue === true) {
                            //     if (that.firstInsertBeginIndex === null) {
                            //         that.firstInsertBeginIndex = insertStartIndex;
                            //     };
                            // };
                            // Break string downs into character and add individual character to 'str' array
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
                            //that.theOne.push(that.theOneSegment(authorId, type, insertStartIndex, "none" ,entry.s));

                            // var locationSoFar = 0,
                            //     findParentSegmentHelperArray = [],
                            //     parentSegmentID = null;

                            if (currentRevID <= 1 && that.pleaseContinue ===true) {
                            	that.pleaseContinue = false;
                            	var parentSegmentID = that.findParentSegment(insertStartIndex,segsInPrevRev);
                            }

                            else{
                            	//console.log("temp: ");
                            	//console.log(that.tempConstructSegmentsForCurrentRev);
                            	var parentSegmentID = that.findParentSegment(insertStartIndex,that.tempConstructSegmentsForCurrentRev);
                            };
							


                            // if there is no parent
                            if (parentSegmentID == -1) {


        //                         var findSegment = null;

								// // need to find the parent segmentID to know about the beginning and end
	       //                      if (currentRevID === 1 && that.pleaseContinue2 ===true) {
	       //                      	that.pleaseContinue2 = false;
	       //                          _.find(segsInPrevRev, function(eachSegment) {
	       //                              if (eachSegment.segID === parentSegmentID) {
	       //                                  findSegment = eachSegment;
	       //                              };
	       //                          });

	       //                      }

	       //                      else{
	       //                          _.find(that.tempConstructSegmentsForCurrentRev, function(eachSegment) {
	       //                              if (eachSegment.segID === parentSegmentID) {
	       //                                  findSegment = eachSegment;
	       //                              };
	       //                          });
	       //                      };
                                

                                //console.log("insert");
                             //   var strToString = that.renderToString(that.str);
                              //  var substringBefore = strToString.substring(findSegment.beginIndex, insertStartIndex);
                               // var substringAfter = strToString.substring(insertStartIndex,findSegment.endIndex);
                               // that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(authorId, entry.s, that.currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex, "insert middle"));
                               // that.currentSegID += 1;
                               // that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(findSegment.author,substringBefore, that.currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex, "insert before"));
                               // that.currentSegID += 1;
                              //  that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(findSegment.author,substringAfter, that.currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex, "insert after"));
                               // that.tempAuthorStr = '';
                               // that.firstInsertBeginIndex = null;   

                                // if (pleaseContinue === true) {

                                //     if (that.firstInsertBeginIndex === null) {
                                //         that.firstInsertBeginIndex = insertStartIndex;
                                //     };
                                //     that.tempAuthorStr += entry.s;
                                // } else {
                                //     that.endInsertBeginIndex = insertStartIndex;
                                //     that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(authorId, that.tempAuthorStr, that.currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex));
                                //     that.tempAuthorStr = '';
                                //     that.firstInsertBeginIndex = null;
                                // }

                            }

                            // if found parentSegmentID
                            else {

                               // that.endInsertBeginIndex = insertStartIndex;
                                var findSegment = null;
                                console.log("current revid: " + currentRevID);
								// need to find the parent segmentID to know about the beginning and end
	                            if (currentRevID == 1 && that.pleaseContinue2 ===true) {
	                            	that.pleaseContinue2 = false;
	                                _.find(segsInPrevRev, function(eachSegment) {
	                                    if (eachSegment.segID === parentSegmentID) {
	                                        findSegment = eachSegment;
	                                    };
	                                });

	                                //console.log("enter 1");

	                                var segmentsBefore = that.findPSegmentBefore(insertStartIndex, segsInPrevRev);
	                                var segmentsAfter = that.findPSegmentAfter(insertStartIndex, segsInPrevRev);

	                                that.tempConstructSegmentsForCurrentRev = [];

	                                that.currentSegID += 1;
	                                _.each(that.segmentsBefore, function(eachSegment){
	                                	that.tempConstructSegmentsForCurrentRev.push(eachSegment);
	                                });
	                                
	                                that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(authorId, entry.s, currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex, "insert middle"));
	                                that.currentSegID += 1;
	                                _.each(that.segmentsAfter, function(eachSegment){
	                                	that.tempConstructSegmentsForCurrentRev.push(eachSegment);
	                                });


	                                //console.log(that.tempConstructSegmentsForCurrentRev);                                

	                            }

	                            else {
	                                _.find(that.tempConstructSegmentsForCurrentRev, function(eachSegment) {
	                                    if (eachSegment.segID === parentSegmentID) {
	                                        findSegment = eachSegment;
	                                    };
	                                });

                                var segmentsBefore = that.findPSegmentBefore(insertStartIndex, that.tempConstructSegmentsForCurrentRev);
                                var segmentsAfter = that.findPSegmentAfter(insertStartIndex, that.tempConstructSegmentsForCurrentRev);

                                that.tempConstructSegmentsForCurrentRev = [];

                                that.currentSegID += 1;
                                that.tempConstructSegmentsForCurrentRev.push(segmentsBefore);
                                that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(authorId, entry.s, currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex, "insert middle"));
                                that.currentSegID += 1;
                                that.tempConstructSegmentsForCurrentRev.push(segmentsAfter);	                                
	                            };
                                

                                //console.log("insert");
                               // var strToString = that.renderToString(that.str);
                              //  var substringBefore = strToString.substring(findSegment.beginIndex, insertStartIndex);
                               // var substringAfter = strToString.substring(insertStartIndex,findSegment.endIndex);


                               // that.tempAuthorStr = '';
                               // that.firstInsertBeginIndex = null;   

                               	
                               //	that.pleaseContinue = false;


                                // if (pleaseContinue === true) {
                                //     if (that.firstInsertBeginIndex === null) {
                                //         that.firstInsertBeginIndex = insertStartIndex;
                                //     };

                                //     if ((insertStartIndex-2 < insertStartIndex < insertStartIndex+2) && (insertStartIndex >= that.firstInsertBeginIndex)) {
                                //     	that.pleaseContinue = true;
                                //     }

                                //     else {

                                //     that.endInsertBeginIndex = insertStartIndex;
                                //     var findSegment = null;

                                //     // need to find the parent segmentID to know about the beginning and end
                                //     _.find(segsInPrevRev, function(eachSegment) {
                                //         if (eachSegment.segID === parentSegmentID) {
                                //             findSegment = eachSegment;
                                //         };
                                //     });
                                //     //console.log("insert");
                                //     var strToString = that.renderToString(that.str);
                                //     var substringBefore = strToString.substring(findSegment.beginIndex,that.firstInsertBeginIndex);
                                //     var substringAfter = strToString.substring(that.endInsertBeginIndex,findSegment.endIndex);
                                //     that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(findSegment.author,substringBefore, currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex, "insert before"));
                                //     that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(authorId, strToString.substring(that.firstInsertBeginIndex, that.endInsertBeginIndex), that.currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex, "insert middle"));
                                //     that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(findSegment.author,substringAfter, currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex, "insert after"));
                                //    // that.tempAuthorStr = '';
                                //     that.firstInsertBeginIndex = null;   

                                //    	that.currentSegID += 1;
                                //    	that.pleaseContinue = false;

                                //     };

                                //     //that.tempAuthorStr += entry.s;

                                // } else { // if please continue is false

                                //     that.endInsertBeginIndex = insertStartIndex;
                                //     var findSegment = null;

                                //     // need to find the parent segmentID to know about the beginning and end
                                //     _.find(segsInPrevRev, function(eachSegment) {
                                //         if (eachSegment.segID === parentSegmentID) {
                                //             findSegment = eachSegment;
                                //         };
                                //     });
                                //     //console.log("insert");
                                //     var strToString = that.renderToString(that.str);
                                //     var substringBefore = strToString.substring(findSegment.beginIndex,that.firstInsertBeginIndex);
                                //     var substringAfter = strToString.substring(that.endInsertBeginIndex,findSegment.endIndex);

                                //     var beforeStr =  "insert before";
                                //     var afterStr = "insert after";                                   
                                //     that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(findSegment.author,substringBefore, currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex, beforeStr));
                                //     that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(authorId, strToString.substring(that.firstInsertBeginIndex, that.endInsertBeginIndex), that.currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex, 'middle insert'));
                                //     that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(findSegment.author,substringAfter, currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex, afterStr));
                                //    // that.tempAuthorStr = '';
                                //     that.firstInsertBeginIndex = null;
                                // };
                            };


                            //console.log(findParentSegmentHelperArray);

                            _.each(entry.s, function(character, index) {
                                var charObj = {
                                    s: character,
                                    aid: authorId
                                };

                                //that.tempSegLength += character.length;
                                that.str.insert(charObj, (insertStartIndex - 1) + index);
                            });
                        }
                    } else if (type === 'ds') {
                        // the first rev
                        if (segsInPrevRev === null) {
                            deleteStartIndex = entry.si;
                            deleteEndIndex = entry.ei;
                            that.tempSegLength -= (deleteEndIndex - deleteStartIndex + 1);
                            this.str.delete(deleteStartIndex - 1, deleteEndIndex - 1);
                        }
                        // calculating the second and following revs, using the segs in previous rev


                        else {




                            deleteStartIndex = entry.si;
                            deleteEndIndex = entry.ei;
                           // that.theOne.push(that.theOneSegment(authorId, type, deleteStartIndex, deleteEndIndex));
                            this.str.delete(deleteStartIndex - 1, deleteEndIndex - 1);
                        
                            var locationSoFar = 0,
                                findParentSegmentHelperArray = [],
                                parentSegmentID = null;

                            
                            parentSegmentID = that.findParentSegment(deleteStartIndex,segsInPrevRev);

                            // if there is no parent
                            if (parentSegmentID == -1) {

                                //   that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(authorId, that.tempAuthorStr, that.currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex));

                            }

                            // if found parentSegmentID
                            else {
                            	

                            	// if (deleteEndIndex - deleteStartIndex > 0) {
                            	// //console.log("enter");
	                            // 	var findSegment = null;
	                            // 	console.log("length of delete: " + (deleteEndIndex - deleteStartIndex) + "from: " + deleteStartIndex + " to: " + deleteEndIndex);
	                            //     // need to find the parent segmentID to know about the beginning and end

	                            //     //that.endDeleteEndIndex = deleteStartIndex;

	                            //     _.find(segsInPrevRev, function(eachSegment) {
	                            //             if (eachSegment.segID === parentSegmentID) {
	                            //                 findSegment = eachSegment;
	                            //             };
	                            //         });
                             //    	var strToString = that.renderToString(that.str);
                             //        that.currentSegID += 1; 
                             //        var beforeStr =  "delete before";
                             //        var afterStr = "delete after";
                             //        that.currentSegID += 1;
                             //        that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(findSegment.author, strToString.substring(findSegment.beginIndex-1, deleteStartIndex-1), that.currentSegID, parentSegmentID, deleteEndIndex, currentRevID, findSegment.beginIndex, deleteStartIndex, beforeStr));
                                    
                             //        //that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(authorId, strToString.substring(that.firstInsertBeginIndex, that.endInsertBeginIndex), that.currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex));
                             //        // findSegment.endIndex - deleteEndIndex
                             //        that.currentSegID += 1;
                             //        that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(findSegment.author, strToString.substring(deleteEndIndex-1, findSegment.endIndex), that.currentSegID, parentSegmentID, findSegment.endIndex, currentRevID, deleteEndIndex, findSegment.endIndex, afterStr));
                             //        that.firstDeleteStartIndex = null;
                             //        //that.pleaseContinue = false;

                             //    };



                             //    if (pleaseContinue === true) {

                             //        if (that.firstDeleteStartIndex === null) {
                             //            that.firstDeleteStartIndex = deleteStartIndex;
                             //        };
                             //    };


                            	// else if (pleaseContinue === false && (that.endDeleteEndIndex-that.firstDeleteStartIndex > 0)) {
                            	// //console.log("enter");
                            	// var findSegment = null;
                             //    // need to find the parent segmentID to know about the beginning and end

                             //    that.endDeleteEndIndex = deleteStartIndex;

                             //    _.find(segsInPrevRev, function(eachSegment) {
                             //            if (eachSegment.segID === parentSegmentID) {
                             //                findSegment = eachSegment;
                             //            };
                             //        });
                             //    	var strToString = that.renderToString(that.str);
                             //        that.currentSegID += 1; 
                             //        var beforeStr =  "delete before";
                             //        var afterStr = "delete after";
                             //        that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(findSegment.author, strToString.substring(findSegment.beginIndex, that.firstDeleteStartIndex), that.currentSegID, parentSegmentID, 0, currentRevID, findSegment.beginIndex, that.firstInsertBeginIndex, beforeStr));
                             //        that.currentSegID += 1;
                             //        //that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(authorId, strToString.substring(that.firstInsertBeginIndex, that.endInsertBeginIndex), that.currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex));
                             //        // findSegment.endIndex - deleteEndIndex
                             //        that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(findSegment.author, strToString.substring(that.endDeleteEndIndex, findSegment.endIndex), that.currentSegID, parentSegmentID, that.endDeleteEndIndex, currentRevID, that.endDeleteEndIndex, findSegment.endIndex, afterStr));
                             //        that.firstDeleteStartIndex = null;
                             //        //that.pleaseContinue = false;

                             //    };


                            //that.tempSegLength -= (deleteEndIndex - deleteStartIndex + 1);
                            

                            };
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

                        if (vizType === 'docuviz') {
                            intervalChangesIndex = this.calculateIntervalChangesIndex(changelog, revTimestamps);
                            console.log(intervalChangesIndex);
                        };

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

                                        that.constructForDocuviz(command, authorId, currentRevID, that.currentSegID, segsInPrevRev, that.prevStr, that.pleaseContinue);


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
                                                that.allSegmentsInCurrentRev.push(that.constructSegment(prevAuthor, that.renderToString(that.str), that.currentSegID, -1, 0, currentRevID, that.firstInsertBeginIndex, that.str.length));
                                                that.currentSegID += 1;
                                                that.tempSegLength = 0;
                                                that.firstInsertBeginIndex = null;
                                                that.pleaseContinue = false;
                                                prevAuthor = currentAuthor;
                                            };


                                            if (soFar === intervalChangesIndex[currentRevID]) {
                                                // if this is the first revision, first cutting point
                                                if (currentRevID === 0) {
                                                    var segments = that.buildAuthorsSegment(that.str, authors);
                                                    revs.push([that.str.length, revTimestamps[currentRevID], revAuthors[currentRevID], segments]);

                                                    revs2.push([that.str.length, revTimestamps[currentRevID], revAuthors[currentRevID], that.allSegmentsInCurrentRev]);

                                                    console.log(that.allSegmentsInCurrentRev);

                                                    that.allSegmentsInCurrentRev = []; // clear all segments in the current Rev to prepare for the next Rev 
                                                    currentRevID += 1;
                                                    segsInPrevRev = revs2[0][3]; // set the segsInPrevRev to the first rev to prepare for the second one
                                                    that.tempSegLength = 0;
                                                    that.prevStr = that.str;
                                                  //  that.pleaseContinue = false;


                                                    // after this point construct begin to take segsInPrevRev into consideration. From now on, sigInPrevRev is not null anymore    
                                                }

                                                // Until the next cutting point, the construct is still running:
                                                // Other cutting points, where we should push rev into revs 
                                                else {
                                                	//console.log("prevAuthor: ", prevAuthor.name);
                                                	//console.log(that.theOne);
                                                	that.theOne = [];

                                                  //  that.pleaseContinue = false;
                                                    var segments = that.buildAuthorsSegment(that.str, authors);
                                                    revs.push([that.str.length, revTimestamps[currentRevID], revAuthors[currentRevID], segments]);

                                                    // push rev into revs
                                                    revs2.push([that.str.length, revTimestamps[currentRevID], revAuthors[currentRevID], that.tempConstructSegmentsForCurrentRev]);

                                                    console.log("curent revID: " + currentRevID);
                                                    console.log(that.tempConstructSegmentsForCurrentRev);
                                                    segsInPrevRev = that.tempConstructSegmentsForCurrentRev;
                                                    that.tempConstructSegmentsForCurrentRev = [];
                                                    currentRevID += 1;
                                                    that.tempSegLength = 0;
                                                    ; // the next cutting point is reached, set segInPrevRev to the previous rev
                                                    that.prevStr = that.str;
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



                    findPSegmentBefore: function(startIndex, segsInPrevRev) {
                            var locationSoFar = 0,
                            	that = this,
                                findParentSegmentHelperArray = [],
                                result = [];

                            // this for loop purpose is to create a different kind of array. For example, the length of each segment in one rev is:
                            // [200,100,300,50] . So we can convert this to: [200,300,600,650]. This can help because if the ibi is 250 we can know right away that
                            // it belong to segment at index 1. ibi: 350 will belong to segment at index 2. The calculation is in the for loop and find function.
                            
                            for (var i = 0; i < segsInPrevRev.length; i++) {

                                if (i === 0) {
                                    findParentSegmentHelperArray.push(that.findParentSegmentHelper(segsInPrevRev[i].segLength.length, segsInPrevRev[i]));
                                } else {
                                    findParentSegmentHelperArray.push(that.findParentSegmentHelper((findParentSegmentHelperArray[locationSoFar].locationBasedOnLength + segsInPrevRev[i].segLength.length), segsInPrevRev[i]));
                                    locationSoFar += 1;
                                };
                            };

                            _.each(findParentSegmentHelperArray, function(eachSegment) {
                                if (eachSegment.locationBasedOnLength <= startIndex) {
                                    result.push(eachSegment);
                                };
                            }); 
                            
                            return result;               	

                    },


                    findPSegmentAfter: function(startIndex, segsInPrevRev) {
                            var locationSoFar = 0,
                            	that = this,
                                findParentSegmentHelperArray = [],
                                result = [];

                            // this for loop purpose is to create a different kind of array. For example, the length of each segment in one rev is:
                            // [200,100,300,50] . So we can convert this to: [200,300,600,650]. This can help because if the ibi is 250 we can know right away that
                            // it belong to segment at index 1. ibi: 350 will belong to segment at index 2. The calculation is in the for loop and find function.
                            
                            for (var i = 0; i < segsInPrevRev.length; i++) {

                                if (i === 0) {
                                    findParentSegmentHelperArray.push(that.findParentSegmentHelper(segsInPrevRev[i].segLength.length, segsInPrevRev[i]));
                                } else {
                                    findParentSegmentHelperArray.push(that.findParentSegmentHelper((findParentSegmentHelperArray[locationSoFar].locationBasedOnLength + segsInPrevRev[i].segLength.length), segsInPrevRev[i]));
                                    locationSoFar += 1;
                                };
                            };

                            _.each(findParentSegmentHelperArray, function(eachSegment) {
                                if (eachSegment.locationBasedOnLength >= startIndex) {
                                    result.push(eachSegment);
                                };
                            }); 
                            
                            return result;               	

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
