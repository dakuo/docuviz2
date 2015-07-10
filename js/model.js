;(function() {
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
        var author = _.where(authors, {id: obj.aid});

        if(obj.s === "\n") {
          return memo + "<br>";
        } else {
          return memo + '<span style="color:' + author[0]['color'] + '">' + obj.s + '</span>';
        }

      },'');
    },
      
      
    renderToString: function(chars) {
        //return '<p>hello world</p>';
      return _.reduce(chars, function(memo, obj) {
        //var author = _.where(authors, {id: obj.aid});

        if(obj.s === "\n") {
          return memo + "<br>";
        } else {
          return memo + obj.s;
        }

      },'');
    },
      
    // Construct method constructs the "str" variable
    construct: function(entry, authorId) {
      var that = this,
          type = entry.ty,
          insertStartIndex = null,
          deleteStartIndex = null,
          deleteEndIndex = null;

      if(type === 'mlti') {
        _.each(entry.mts, function(ent) {
          that.construct(ent, authorId);
        });

      } 
        
        else if(type === 'rplc') {
        _.each(entry.snapshot, function(ent) {
          that.construct(ent, authorId);
        });

      }
        
        else if(type === 'is') {
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
      }
        
        else if (type === 'as') {
           
      var stringModifications = entry.sm,
                   startIndex = entry.si,
                     endIndex = entry.ei,
                  specialType = entry.st
       // console.log(entry);
      for (var i = startIndex - 1; i < endIndex; i++) {
        $.extend(that.str[i], stringModifications)
      }
    }
        else {
    // todo
         }

      return true;
    },

      
    allSegmentsInCurrentRev: [],
    tempSegLength: 0,
    tempConstructSegmentsForCurrentRev: [],
    prevStr: '',
    pleaseContinue: true,
    tempAuthorStr: '',
    firstInsertBeginIndex: null,
    endInsertBeginIndex: null,

    constructSegment: function(author, segStr, segID, parentSegID, offset,revID, beginIndex, endIndex) {
        return {
            author: author,
            segLength: segStr,
            segID: segID,
            parentSegID: parentSegID,
            offset: offset,
            revID: revID,
            beginIndex: beginIndex,
            endIndex: endIndex
        };
    },

    findParentSegmentHelper: function(locationBasedOnLength, segmentID){
    	return{
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


		if(type === 'mlti') {
		    _.each(entry.mts, function(ent) {
		      that.constructForDocuviz(ent, authorId, currentRevID, currentSegID, segsInPrevRev, prevStr, pleaseContinue);
		    });
		} 

		else if(type === 'rplc') {
		    _.each(entry.snapshot, function(ent) {
		      that.constructForDocuviz(ent, authorId, currentRevID, currentSegID, segsInPrevRev, prevStr, pleaseContinue);
		    });
		}

		else if(type === 'is') {
			// the first rev
			if(segsInPrevRev===null){
			    insertStartIndex = entry.ibi;

				if (that.firstInsertBeginIndex===null){
					that.firstInsertBeginIndex = insertStartIndex;
				};			    

			    // Break string downs into character and add individual character to 'str' array
			    _.each(entry.s, function(character, index) {           
			      var charObj = {
			        s: character,
			        aid: authorId
			      };
			
			      that.tempSegLength += character.length;
			      that.str.insert(charObj, (insertStartIndex - 1) + index);
			    });
			}
			// calculating the second and following revs, using the segs in previous rev
			else{

				insertStartIndex = entry.ibi;
				var locationSoFar = 0,
					findParentSegmentHelperArray = [],
					parentSegmentID = null;
				

				// this for loop purpose is to create a different kind of array. For example, the length of each segment in one rev is:
				// [200,100,300,50] . So we can convert this to: [200,300,600,650]. This can help because if the ibi is 250 we can know right away that
				// it belong to segment at index 1. ibi: 350 will belong to segment at index 2. The calculation is in the for loop and find function.
				for (var i = 0; i < segsInPrevRev.length; i++) {

					if (i === 0){
						findParentSegmentHelperArray.push(that.findParentSegmentHelper(segsInPrevRev[i].segLength, segsInPrevRev[i].segID));
					}
					else{
						findParentSegmentHelperArray.push(that.findParentSegmentHelper((findParentSegmentHelperArray[locationSoFar].locationBasedOnLength + segsInPrevRev[i].segLength), segsInPrevRev[i].segID));
						locationSoFar += 1;
					};
				};

				_.find(findParentSegmentHelperArray, function(eachSegment){
					if (insertStartIndex <= eachSegment.locationBasedOnLength){ 
						parentSegmentID = eachSegment.segmentID;
					}
					else{
						parentSegmentID = -1;
					};
				});

				// if there is no parent
				if (parentSegmentID == -1){

					if (pleaseContinue===true){
						if (that.firstInsertBeginIndex===null){
							that.firstInsertBeginIndex = insertStartIndex;
						};
						that.tempAuthorStr += entry.s;
					}

					else{
						that.endInsertBeginIndex = insertStartIndex;
						that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(authorId,that.tempAuthorStr, currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex));
						that.tempAuthorStr = '';
						that.firstInsertBeginIndex = null;
					}

				}

				// if found parentSegmentID

				else{

					if (pleaseContinue===true){
						if (that.firstInsertBeginIndex===null){
							that.firstInsertBeginIndex = insertStartIndex;
						};

						that.tempAuthorStr += entry.s;
					}

					else {
						that.endInsertBeginIndex = insertStartIndex;
						var findSegment = null;

						// need to find the parent segmentID to know about the beginning and end
						_.find(segsInPrevRev, function(eachSegment){
							if (eachSegment.segID === parentSegmentID){
								findSegment = eachSegment;
							};
						});

						//var strToString = that.renderToString(prevStr);
						//var substringBefore = strToString.substring(findSegment.beginIndex,that.firstInsertBeginIndex);
						//var substringAfter = strToString.substring(that.endInsertBeginIndex,findSegment.endIndex);	
						//that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(authorId,substringBefore.length, currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex));
						that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(authorId,that.tempAuthorStr.length, currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex));
						//that.tempConstructSegmentsForCurrentRev.push(that.constructSegment(authorId,substringAfter.length, currentSegID, parentSegmentID, insertStartIndex, currentRevID, that.firstInsertBeginIndex, that.endInsertBeginIndex));
						that.tempAuthorStr = '';
						that.firstInsertBeginIndex = null;
					};
				};


				//console.log(findParentSegmentHelperArray);

			    _.each(entry.s, function(character, index) {           
			      var charObj = {
			        s: character,
			        aid: authorId
			      };
			
			      that.tempSegLength += character.length;
			      that.str.insert(charObj, (insertStartIndex - 1) + index);
			    });
			}
		}

		else if (type === 'ds') {
			// the first rev
			if(segsInPrevRev===null){
			    deleteStartIndex = entry.si;
			    deleteEndIndex = entry.ei;
			    that.tempSegLength -= (deleteEndIndex - deleteStartIndex + 1);
			    this.str.delete(deleteStartIndex - 1, deleteEndIndex - 1);
			}
			// calculating the second and following revs, using the segs in previous rev
			else{

			    deleteStartIndex = entry.si;
			    deleteEndIndex = entry.ei;
			    that.tempSegLength -= (deleteEndIndex - deleteStartIndex + 1);
			    this.str.delete(deleteStartIndex - 1, deleteEndIndex - 1);

			}
		}
		// todo delete the CODE
		else if (type === 'as') {
		  var stringModifications = entry.sm,
		               startIndex = entry.si,
		                 endIndex = entry.ei,
		              specialType = entry.st
		   
		  for (var i = startIndex - 1; i < endIndex; i++) {
		        $.extend(that.str[i], stringModifications)
		  };
		}
		else {
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
		   revs2 = [],
		  currentRevID = 0,
		  intervalChangesIndex = [],
		  currentSegID = 0,
		  segsInPrevRev = null,
		  differentAuthor = null;
        
        if (vizType === 'docuviz'){
            intervalChangesIndex = this.calculateIntervalChangesIndex(changelog, revTimestamps);
        };
        
        // ***
        var prevAuthor = _.find(authors, function(eachAuthor){ 
                  return eachAuthor.id === authors[0].id;
              });
        
        
		// Async run through each entry in a synchronous sequence.
		async.eachSeries(changelog, function(entry, callBack) {
		    authorId = entry[2],
		    command = entry[0];
		  
		  	// Find author object based on authorId:
		  
		    var currentAuthor = _.find(authors, function(eachAuthor){ 
		          return eachAuthor.id === authorId;
		    });
		    

			// Retrieve the Google Doc Tab and send a message to that Tab's view
		    chrome.tabs.query({url: '*://docs.google.com/*/' + docId + '/edit'}, function(tabs) {
		    chrome.tabs.sendMessage(tabs[0].id, {msg: 'progress', soFar: soFar + 1}, function(response) {

		      
		    // Update progress bar
		    soFar += 1;
		      
		    if (vizType === 'authorviz'){
		        that.construct(command, authorId);
		        if(soFar === editCount) {

		                html = that.render(that.str, authors);
		                chrome.tabs.query({url: '*://docs.google.com/*/' + docId + '/edit'}, function(tabs) {    
		                    chrome.tabs.sendMessage(tabs[0].id, {msg: 'render', html: html}, function(response) {});
		                });


		        };
		    }
		        
		    else if (vizType === 'docuviz'){
                
		        that.constructForDocuviz(command, authorId, currentRevID, currentSegID, segsInPrevRev, that.prevStr, that.pleaseContinue);  

		        if (currentRevID < intervalChangesIndex.length){
		        	// handle author difference other than the first revision


		            if (prevAuthor.id === currentAuthor.id){
		            	that.pleaseContinue = true;
		            	prevAuthor = currentAuthor;
		            };

		            if (prevAuthor.id != currentAuthor.id && currentRevID != 0){
		                currentSegID += 1;
		                that.tempSegLength = 0;
		                that.pleaseContinue = false;
		                prevAuthor = currentAuthor;

		            };

		        	// if previous author is different than the current author OR soFar has reaches the first cutting point
		        	// in case the first revision has only one author contributed to it 
		            if (prevAuthor.id != currentAuthor.id || soFar === intervalChangesIndex[0]) {
		                that.allSegmentsInCurrentRev.push(that.constructSegment(prevAuthor, that.tempSegLength, currentSegID, -1, 0, currentRevID, that.firstInsertBeginIndex,that.tempSegLength));
		                currentSegID += 1;
		                that.tempSegLength = 0;
		                that.firstInsertBeginIndex = null;
		                that.pleaseContinue = false;
		                prevAuthor = currentAuthor;
		            };


		            if (soFar === intervalChangesIndex[currentRevID]) {
		            	// if this is the first revision, first cutting point
		            	if(currentRevID === 0){ 
			                var segments = that.buildAuthorsSegment(that.str,authors);
			                revs.push([that.str.length,revTimestamps[currentRevID], revAuthors[currentRevID],segments]);

			                console.log(that.allSegmentsInCurrentRev);
			                revs2.push([that.str.length,revTimestamps[currentRevID], revAuthors[currentRevID],that.allSegmentsInCurrentRev]);
			                that.allSegmentsInCurrentRev = []; // clear all segments in the current Rev to prepare for the next Rev 
			                currentRevID += 1;
			                segsInPrevRev = revs2[0][3]; // set the segsInPrevRev to the first rev to prepare for the second one
			                that.tempSegLength = 0;
			                that.prevStr = that.str;
			                that.pleaseContinue = false;


			                // after this point construct begin to take segsInPrevRev into consideration. From now on, sigInPrevRev is not null anymore    
		                }

		                // Until the next cutting point, the construct is still running:
		                // Other cutting points, where we should push rev into revs 
		                else {
		                	that.pleaseContinue = false;
		                	var segments = that.buildAuthorsSegment(that.str,authors);
		                	revs.push([that.str.length,revTimestamps[currentRevID], revAuthors[currentRevID],[]]);
		                	
		                	// push rev into revs
		                	revs2.push([that.str.length,revTimestamps[currentRevID], revAuthors[currentRevID],that.tempConstructSegmentsForCurrentRev]);

		                	console.log("curent revID: " + currentRevID);
		                	console.log(that.tempConstructSegmentsForCurrentRev);

		                	that.tempConstructSegmentsForCurrentRev = [];
		                	currentRevID += 1;
		                	that.tempSegLength = 0;
		                	segsInPrevRev = revs2[currentRevID-1][3]; // the next cutting point is reached, set segInPrevRev to the previous rev
		                	that.prevStr = that.str;
		                }
		                
		            };


		            // else{
		            // 	// where we calculate the segments, but not pushing rev
		            // }
		            

		            
		            
		        }
		        // reaching the end of changelog
	            else {
                    console.log('the end of changelog');
                    chrome.tabs.query({url: '*://docs.google.com/*/' + docId + '/edit'}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {msg: 'renderDocuviz', chars: that.str, revData: revs}, function(response) {});
                    });


	            };                
		    };

		    // Callback lets async knows that the sequence is finished can it can start run another entry           
	        callBack();
		  	});
			});
		});
    }, 
      
	buildAuthorsSegment: function(chars, authors){
	  var segments = [];
	  var tempAuthor = chars[0].aid;
	  var tempStr = '';
	  var counter = 0;
	  
	  _.each(chars, function(element){
	      
	      if (element.aid != tempAuthor){
	          var currentAuthor = _.find(authors, function(eachAuthor){ 
	              return eachAuthor.id === tempAuthor;
	          });
	          
	          segments.push([currentAuthor, tempStr]);
	          tempStr = '';
	          tempAuthor = element.aid;
	      };
	      
	      if (element.aid === tempAuthor) {
	          tempStr += element.s;
	          var currentAuthor = _.find(authors, function(eachAuthor){ 
	              return eachAuthor.id === tempAuthor;
	          });
	          
	          // the if statement below handles the case when the revision is done by 1 author
	          if (counter === (chars.length-1)){
	              segments.push([currentAuthor,tempStr]);
	          };
	      };
	      counter += 1;
	  });

	  return segments;
	  

	},
      
      
      calculateIntervalChangesIndex: function(logData, timeStamp){
          var indexArray = [];
          var stampIndex = function(index1, index2){
              return { 
                  index1: index1,
                  index2: index2
              };
              
          };
              
          var reducedlogData = _.map(logData, function(val){
              return val[1];
          });
          
          _.each(timeStamp, function(val) {

              indexArray.push(_.indexOf(reducedlogData,val.timestamp2));
          
         }); 
          return indexArray;
    },
      
      
      
  });


  // Listen to message sent out from the View
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      switch(request.msg) {
        // If the message is 'changelog', run 'buildRevision'
        case 'changelog':
          authorviz.buildRevisions(request.vizType, request.docId, request.changelog, request.authors, request.revTimestamps, request.revAuthors);
            break;

        default:
      }
    });

}());