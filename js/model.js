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
           // that.allSegments.push(segment());
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
        else{
    // todo
        }

      return true;
    },

      
    allSegments: [],
    tempSegLength: 0,
      tempSegStr: '',
    segment: function(author, segStr, segID, parentSegID, offset,revID) {
        return {
            author: author,
            segLength: segStr,
            segID: segID,
            parentSegID: parentSegID,
            offset: offset,
            revID: revID
            };
        
    },
      
      
    constructForDocuviz: function(entry, authorId, currentRevID, currentSegID) {
      var that = this,
          type = entry.ty,
          insertStartIndex = null,
          deleteStartIndex = null,
          deleteEndIndex = null;
    

      if(type === 'mlti') {
            _.each(entry.mts, function(ent) {
              that.constructForDocuviz(ent, authorId, currentRevID, currentSegID);
            });
      } 
        
        else if(type === 'rplc') {
            _.each(entry.snapshot, function(ent) {
              that.constructForDocuviz(ent, authorId, currentRevID, currentSegID);
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
                
              that.tempSegLength += 1;
              that.str.insert(charObj, (insertStartIndex - 1) + index);
                
            });

        }
        
        else if (type === 'ds') {
            deleteStartIndex = entry.si;
            deleteEndIndex = entry.ei;
            this.str.delete(deleteStartIndex - 1, deleteEndIndex - 1);
      }
        
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
    // todo
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
          currentSegID = 0; 
        
        if (vizType === 'docuviz'){
            intervalChangesIndex = this.calculateIntervalChangesIndex(changelog, revTimestamps);
        };
        
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
                    if (vizType === 'authorviz'){
                        html = that.render(that.str, authors);
                        chrome.tabs.query({url: '*://docs.google.com/*/' + docId + '/edit'}, function(tabs) {    
                            chrome.tabs.sendMessage(tabs[0].id, {msg: 'render', html: html}, function(response) {});
                        });

                    };
                };
            }
                
            else if (vizType === 'docuviz'){
                that.constructForDocuviz(command, authorId, currentRevID, currentSegID);  
                
                
                if (currentRevID < intervalChangesIndex.length){
                    
                    if (soFar === intervalChangesIndex[currentRevID]) {
                        var segments = that.buildAuthorsSegment(that.str,authors);
                        revs.push([that.str.length,revTimestamps[currentRevID], revAuthors[currentRevID],segments]);
                        
                        currentRevID += 1;
                    };
                    
                    if (prevAuthor.id != currentAuthor.id){
                        that.allSegments.push(that.segment(prevAuthor, that.tempSegLength, currentSegID, -1, 0, currentRevID));
                        currentSegID += 1;
                        that.tempSegLength = 0;
                        that.tempSegStr = '';
                    };
                    
                    prevAuthor = currentAuthor;
                };
                
                
                    if (soFar === editCount) {
                        if (vizType === 'docuviz'){
                                console.log('type is docuviz');
                                chrome.tabs.query({url: '*://docs.google.com/*/' + docId + '/edit'}, function(tabs) {
                                chrome.tabs.sendMessage(tabs[0].id, {msg: 'renderDocuviz', chars: that.str, revData: revs}, function(response) {});
                                });
                        };
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
          authorviz.buildRevisions(request.vizType, request.docId, request.changelog, request.authors, request.timeStamp, request.authorsTimestamp);
            break;

        default:
      }
    });

}());