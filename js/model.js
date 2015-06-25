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
        });

      } else if (type === 'ds') {
        deleteStartIndex = entry.si;
        deleteEndIndex = entry.ei;

        this.str.delete(deleteStartIndex - 1, deleteEndIndex - 1);
      }
        
        else if (type === 'as') {
            //console.log("entering as");
      var stringModifications = entry.sm,
                   startIndex = entry.si,
                     endIndex = entry.ei,
                  specialType = entry.st
       // console.log(entry);
      for (var i = startIndex - 1; i < endIndex; i++) {
        //console.log(that.str[i]);
        $.extend(that.str[i], stringModifications)
        //console.log(that.str[i]);
      }
    }
        else{
    // todo
        }

      return true;
    },

      
      

    buildRevisions: function(vizType, docId, changelog, authors, timeStampsAndAuthors) {
      // Clear previous revision data
      this.str = [];
      var that = this,
          soFar = 0,
          revisionNumber = changelog.length,
          html = '',
          command = null,
          authorId = null,
          revLengths = [],
          currentInterval = 0,
          timestamps = [];
        var contentInterval = [];
        
        // console.log(timeStampsAndAuthors);
        if (vizType === 'docuviz'){
            that.timestamps = this.calculateRevisionLengths(changelog, timeStampsAndAuthors[0])
        };

      // Async run through each entry in a synchronous sequence.
      async.eachSeries(changelog, function(entry, callBack) {
            authorId = entry[2],
            command = entry[0];

        // Retrieve the Google Doc Tab and send a message to that Tab's view
            chrome.tabs.query({url: '*://docs.google.com/*/' + docId + '/edit'}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {msg: 'progress', soFar: soFar + 1}, function(response) {

              
            // Update progress bar
            soFar += 1;
            //var tempAuthor = authorId;
              
            that.construct(command, authorId);
              
            
            


            // Callback lets async knows that the sequence is finished can it can start run another entry
            callBack();

            // When Progress Bar reaches 100%, do something
            if(soFar === revisionNumber) {
                // === revisionNumber

                
                
                if (vizType === 'authorviz'){
                    console.log('type is authorviz');
                
                    html = that.render(that.str, authors);
                    console.log('length');
                    console.log(that.str.length);
                    chrome.tabs.query({url: '*://docs.google.com/*/' + docId + '/edit'}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {msg: 'render', html: html}, function(response) {
                //    console.log(response);
                    
                });
               });
                
                };
                
              if (vizType === 'docuviz'){
                    console.log('type is docuviz');
                 // console.log("revLength: " + revLengths);
                    chrome.tabs.query({url: '*://docs.google.com/*/' + docId + '/edit'}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {msg: 'renderDocuviz', chars: that.str, revData: revLengths}, function(response) {
                //    console.log(response);
                    
                });
               });
                
                };
                
            };
              
             // console.log('current interval: ' + currentInterval);
            if (vizType === 'docuviz'){
                if (currentInterval < that.timestamps.length){
                    if (soFar === that.timestamps[currentInterval].index2) {

//                        console.log("authors: " + authors);
                        var segments = that.buildAuthorsSegment(that.str,authors);
                        //console.log("segments: " + currentInterval + " " + segments);
                        // array: [length, timestamp, author, current string]
                        //console.log(timeStampsAndAuthors[1][currentInterval]);
                        // for the purpose of this version, current string interval is deleted: that.renderToString(that.str)
                        revLengths.push([that.str.length,timeStampsAndAuthors[0][currentInterval], timeStampsAndAuthors[1][currentInterval],segments]);
                        //contentInterval.push(that.renderToString(that.str));
                        currentInterval +=1;
                       // console.log('rev Array for:' + currentInterval + ' is '  + revLengths); 
                        //console.log(contentInterval);
                        //segments = [];
                    };
                    

                };
            };
              
            
              
              
          });

        });
      });
    },
      
      
      buildAuthorsSegment: function(chars, authors){
          //var authorsContribution = [];
          var segments = [];
          var tempAuthor = chars[0].aid;
          var tempStr = '';
          var counter = 0;
          
          _.each(chars, function(element){
              
              if (element.aid != tempAuthor){
                  //console.log("not equal");
                  var currentAuthor = _.find(authors, function(eachAuthor){ 
                      return eachAuthor.id === tempAuthor;
                  });
                  
                  segments.push([currentAuthor, tempStr]);
                  tempStr = '';
                  tempAuthor = element.aid;
              };
              
              if (element.aid === tempAuthor) {
                  //console.log("equal");
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
      
      calculateRevisionLengths: function(logData, timeStamp){
          //console.log(timeStamp);
          //console.log(logData);
          
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
          
          var counter = 1;
          _.each(timeStamp, function(val) {
              //console.log(val);
              indexArray.push(stampIndex(_.indexOf(reducedlogData, val.timestamp1),_.indexOf(reducedlogData,            val.timestamp2)));
          
         }); 
          //console.log(indexArray);
          return indexArray;
    },
      
      
      
  });


  // Listen to message sent out from the View
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      switch(request.msg) {
        // If the message is 'changelog', run 'buildRevision'
        case 'changelog':
          authorviz.buildRevisions(request.vizType, request.docId, request.changelog, request.authors, request.timeStamp);
            break;

        default:
      }
    });

}());