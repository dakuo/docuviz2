// Authorviz Annotations
// _____________________________
//
// BB: means Black Box. When you see this, it means you don't need to care about what goes inside the methods. It is because the method name is self-explanatory and inside is complex. The methods do what they supposed to do





;
(function() {
    'use strict';

    // Reserve the "$" character to only be use as a call to to jQuery
    // e.g. instead of writing "jQuery.someMethods", you can write "$.someMethods"
    var $ = jQuery.noConflict();

    // If authorviz is already exist, use it. Otherwise make a new object
    var authorviz = authorviz || {};


    // Add new properties to the existing object's properties
    $.extend(authorviz, {
        // Store each author object in the document
        // Each author object will have a unique ID, color, and name
        authors: [],
        authorsTimestamp: [],
        timestamps: [],
        revisionLengths: [],


        // Loaded lets us know whether users run Authorviz or not. If they already ran it, "loaded" will be set to "true" and the next time they click on the Authorviz Button again, the app won't load the revisions again and simply display the results since they already loaded the revisions on their first time clicking the Authorviz Button
        loaded: false,

        // Initialize the application
        init: function() {
            // History URL be use as an URL in an AJAX call later. The ajax call allows us to grab the Total Revision Number and Authors data
            var historyUrl = null;

            // Render means displaying HTML onto the page. From now on, whenever you see the keyword "render" (e.g. renderButton, renderProgressBar) it means that the methods will inject the HTML code into the page
            this.renderApp();

            // setToken method sets the Google Document's unique token onto the page so that we can retrieve it later for other uses.
            // The token is required in all Ajax URL from Google Doc
            this.setToken();

            // getHistoryUrl constructs the history URL
            historyUrl = this.getHistoryUrl(location.href);

            // This method makes the Ajax call using the History URL. The method will grab Google Doc's History Data. In that data, there are important informations such as Revision Numbers and Authors data
            this.getHistoryData(historyUrl);
        },


        // Set Token on Body Tag
        // ** BB
        setToken: function() {
            var code = function() {
                document.getElementsByTagName('body')[0].setAttribute("tok", _docs_flag_initialData.info_params.token)
            };
            var script = document.createElement('script');
            script.textContent = '(' + code + ')()';
            (document.head || document.documentElement).appendChild(script);
            script.parentNode.removeChild(script);
        },


        // Set Revision Number to corresponded elements
        setRevisionNumber: function(num) {
            $('.js-revision-number').add('.js-revision-out-of').text(num);
        },


        // Get the Google Doc's ID
        // ** BB
        getDocId: function() {
            var regexMatch = location.href.match("((https?:\/\/)?docs\.google\.com\/(.*?\/)*document\/d\/(.*?))\/edit");
            return regexMatch[4];
        },


        // Get the Google Doc's unique Token
        // The token is required to construct certain Ajax URL
        getToken: function() {
            return $('body').attr('tok');
        },


        // Construct History URL to be use in an Ajax call
        // ** BB
        getHistoryUrl: function(url, switchUrl) {
            var token = this.getToken(),
                regexMatch = url.match("((https?:\/\/)?docs\.google\.com\/(.*?\/)*document\/d\/(.*?))\/edit"),
                http = regexMatch[1],

                historyUrl = null;

            if (switchUrl) {
                http = http.replace('/d/', '/u/1/d/');
            }

            historyUrl = http + '/revisions/history?id=' + this.getDocId() + "&token=" + token + "&start=1&end=-1&zoom_level=0";

            return historyUrl;
        },


        // Ajax call to get Google Doc's history data which contains revision number and authors data
        getHistoryData: function(url) {
            var that = this;

            $.ajax({
                type: 'GET',
                url: url,
                dataType: 'html',

                // If the Ajax call failed, make another call using a different url
                error: function(request, error) {
                    var historyUrl = null;

                    if (request.status === 400) {
                        historyUrl = that.getHistoryUrl(location.href, true);
                        that.getHistoryData(historyUrl);
                    }
                },

                // If the call success, turn the result DATA into JSON object and get the important information (Revision number & authors data)
                success: function(data) {
                    var raw = jQuery.parseJSON(data.substring(4)),
                        revisionNumber = raw[raw.length - 1][raw[raw.length - 1].length - 1][3];

                    that.setRevisionNumber(revisionNumber);
                    $('.js-authorviz-btn').removeClass('is-disabled');
                    $('.js-docuviz-btn').removeClass('is-disabled');

                    that.authors = that.parseAuthors(raw[2]);
                    that.parseTimestampsAuthors(raw[2])

                }
            })
        },


        // parseAuthors method receive "raw authors" data (JSON Object) and maniputlate on that JSON Object to return a set of structural Author Object.
        // ** BB
        parseAuthors: function(data) {
            var rawData,
                i,
                rawAuthors = [],
                authors = [],
                authorId = [];

            // Author is a factory that creat "author object" a set of structural property and value.
            // If you come from Programming language like Java, C, C++, Python, think of this Author as a Class used to create as many author children as needed
            var Author = function(name, color, id) {
                return {
                    name: name,
                    color: color,
                    id: id
                };
            };


            // _. is a reserved syntax used in Underscore Library
            // _.map receives input in a form of Array then loop through that Array to return a value based on your definition. The result will also be in a form of an Array
            // e.g.
            // _.map([0,1,2,3], function(val) {
            //    return val + 2;
            // });
            // The result of the above function would be
            // [2,3,4,5]
            rawData = _.map(data, function(val) {
                return val[1];
            });


            // _.flatten removes one level of from the Array hierarchy
            // e.g.
            // _.flatten([a,b,[c],[[d]]], true);
            // The result of the above function would be
            // [a,b,c,[d]]
            rawData = _.flatten(rawData, true);


            // _.each loops through the rawData and do something for each value
            _.each(rawData, function(val) {
                //val[2] = Name
                //val[3] = Color
                //val[4] = ID
                rawAuthors.push(Author(val[2], val[3], val[4]));
                authorId.push(val[4]);
            });

            authorId = _.intersection(authorId);

            _.each(authorId, function(val) {
                authors.push(_.findWhere(rawAuthors, {
                    id: val
                }));
            });

            return authors;
        },





        // ** BB
        parseTimestampsAuthors: function(data) {
            var that = this,
                rawData,
                i,
                rawAuthors = [],
                //  authors = [],
                authorId = [];
            //timestamps = [];

            // Author is a factory that creat "author object" a set of structural property and value.
            // If you come from Programming language like Java, C, C++, Python, think of this Author as a Class used to create as many author children as needed
            var author = function(name, color, id) {
                return {
                    name: name,
                    color: color,
                    id: id
                };
            };

            var timeStamp = function(timestamp1, timestamp2) {
                return {
                    timestamp1: timestamp1,
                    timestamp2: timestamp2
                };
            };


            rawData = data;


            _.each(rawData, function(val) {
                //timestamps.push(timeStamp(val[4], val[5]));
                that.timestamps.push((timeStamp(val[4], val[5])));
                //timestamps.push(val[5]);

            });


            rawData = _.map(data, function(val) {
                return val[1];
            });


            // find authors related to timestamps array:
            _.each(rawData, function(val) {

                var array = [];
                _.each(val, function(val2) {
                        array.push(author(val2[2], val2[3], val2[4])); //to return author name use val2[2], return author id use val2[4]   
                    }

                )

                that.authorsTimestamp.push(array);
                array = [];

            });

        },


        getDocTitle: function() {
            return $('#docs-title-inner').text();
        },


        getRevisionNumber: function() {
            return $('.js-revision-number').text();
        },


        // Construct an URL to retrieve Changelog Data
        // ** BB
        getChangelogUrl: function() {
            var regmatch = location.href.match(/^(https:\/\/docs\.google\.com.*?\/document\/d\/)/),
                baseUrl = regmatch[1],
                loadUrl = baseUrl + this.getDocId() + "/revisions/load?id=" + this.getDocId() + "&start=1&end=" + parseInt(('' + this.getRevisionNumber()).replace(/,/g, '')) + "&token=" + this.getToken();
            console.log('got changelogURL: ' + loadUrl);
            return loadUrl;
        },


        getChangelogUrlForDocuviz: function() {
            var regmatch = location.href.match(/^(https:\/\/docs\.google\.com.*?\/document\/d\/)/),
                baseUrl = regmatch[1],
                loadUrl = baseUrl + this.getDocId() + "/revisions/load?id=" + this.getDocId() + "&start=1&end=" + parseInt(('' + this.getRevisionNumber()).replace(/,/g, '')) + "&token=" + this.getToken();
            console.log('got changelogURL: ' + loadUrl);
            return loadUrl;
        },



        // Retrieve Changelog data and send it to Model
        getChangelog: function(url, vizType) {
            // this stores reference to current object
            var that = this;

            $.ajax({
                type: 'GET',
                url: url,
                dataType: 'html',

                // If the call success, send Changelog Data, Document ID, authors data to Model
                success: function(data) {
                    console.log('GOT changelog data')
                    var raw = jQuery.parseJSON(data.substring(4));
                    // Send Changelog data to Model
                    //console.log(data);
                    chrome.runtime.sendMessage({
                        msg: 'changelog',
                        vizType: vizType,
                        docId: that.getDocId(),
                        changelog: raw.changelog,
                        authors: that.authors,
                        revTimestamps: that.timestamps,
                        revAuthors: that.authorsTimestamp
                    }, function(data) {});
                    // chrome.runtime.sendMessage({msg: 'buildRevLengths', changelog: raw.changelog, timeStamp: that.timestamps[0]}, function(data){});
                },
                error: function(error) {
                    console.log(error.status);
                }
            });
        },

        // Bind Click Event onto the Authorviz Button
        addListenerToAuthorvizBtn: function() {
            var that = this;

            // When the button is click, show the app and disable this button
            $(document).on('click', '.js-authorviz-btn', function() {
                var changelogUrl = null;
                $('.js-result').html('')
                // Make the App Visible to user
                $('.js-authorviz').removeClass('hideVisually');
                //$('.js-progress-bar').removeClass('hideVisually');


                changelogUrl = that.getChangelogUrl(location.href);
                that.getChangelog(changelogUrl, 'authorviz');

                // Remove the click event from Authorviz button
               // $(document).off('click', '.js-authorviz-btn');
            });
        },



        // Bind Click Event onto the Docuviz Button
        addListenerToDocuvizBtn: function() {
            var that = this;

            // When the button is click, show the app and disable this button
            $(document).on('click', '.js-docuviz-btn', function() {
                var changelogUrl = null;
                $('.js-result').html('')
                // Make the App Visible to user
                $('.js-authorviz').removeClass('hideVisually');
               // $('.js-progress-bar').removeClass('hideVisually');
                console.log('got docuviz');

                changelogUrl = that.getChangelogUrlForDocuviz(location.href);
                that.getChangelog(changelogUrl, 'docuviz');

                // Remove the click event from Docuviz button
               // $(document).off('click', '.js-docuviz-btn');
            });
        },


        // *************************************
        //   RENDER (Inject HTML in the page)
        // *************************************

        renderApp: function() {
            // js-authorviz: Authoviz App
            // js-progress-bar: Progress Bar
            // js-progress-so-far: Updated part of Progress Bar
            // js-revision-so-far: Revision Number so far
            // js-revision-out-of: Total number of revisions
            // js-doc-title: Document's title
            // js-author: The author section
            // js-result: The result panel
            // js-left-panel: Left Panel

            var html = '<div class="authorviz js-authorviz hideVisually"><div class="authorviz__layout"><div class="l-half l-half--top authorviz__wrap--top"><div class="aligner txt-c js-left-panel" style="height: 100%"><div class="aligner-item authorviz__intro"><div class="aligner-item aligner-item-top"><h3 class="authorivz__doc-title js-doc-title">Final Paper</h3><div class="js-author authorviz__author"></div></div><div class="aligner-item js-progress-bar"><div class="authorviz__progress-bar"><div class="authorviz__progress-bar-item js-progress-so-far"></div></div><p class="authorviz__loading-text">Loading <span class="js-revision-so-far">0</span>/<span class="js-revision-out-of">?</span> revisions</p></div></div></div></div><div class="l-half l-half--bottom authorviz__wrap--bottom"><div class="authoviz__box js-result"></div></div></div></div>';

            $('body').prepend(html);

            this.renderAuthorvizBtn();

            // Update Document Title
            $('.js-doc-title').text(this.getDocTitle());

        },


        renderAuthorvizBtn: function() {
            var btnGroup = $('#docs-titlebar-share-client-button').prev();

            // js-authorviz: feature btn
            // js-revision-number: revision number
            $('<div class="goog-inline-block js-authorviz-btn is-disabled"><div role="button" class="goog-inline-block jfk-button jfk-button-standard docs-titlebar-button jfk-button-clear-outline" aria-disabled="false" aria-pressed="false" tabindex="0" data-tooltip="Visualize Document" aria-label="Visualize Document" value="undefined" style="-webkit-user-select: none;">Visualize Document (<span class="js-revision-number">loading</span> revisions)</div><div id="docs-docos-caret" style="display: none" class="docos-enable-new-header"><div class="docs-docos-caret-outer"></div><div class="docs-docos-caret-inner"></div></div></div><div class="goog-inline-block js-docuviz-btn is-disabled"><div role="button" class="goog-inline-block jfk-button jfk-button-standard docs-titlebar-button jfk-button-clear-outline" aria-disabled="false" aria-pressed="false" tabindex="0" data-tooltip="Docuviz" aria-label="Docuviz" value="undefined" style="-webkit-user-select: none;">Docuviz</div><div id="docs-docos-caret" style="display: none" class="docos-enable-new-header"><div class="docs-docos-caret-outer"></div><div class="docs-docos-caret-inner"></div></div></div>').prependTo(btnGroup);

            this.addListenerToAuthorvizBtn();
            this.addListenerToDocuvizBtn();
        },




        renderProgressBar: function(soFar) {
            var outOf,
                progressSoFar;

            // If users already loaded Revision data, don't need to display the Progress Bar again
            if (this.loaded) {
                return;
            }

            outOf = this.getRevisionNumber();
            progressSoFar = (soFar / outOf) * 100;

            $('.js-progress-so-far').css("width", progressSoFar + '%');
            $('.js-revision-so-far').text(soFar);

            // When progress bar is fully loaded, do something
            if (progressSoFar === 100) {
                this.loaded = true;
                this.renderCloseBtn();
                this.renderPrintBtn();
                $('.js-progress-bar').addClass('hideVisually');
                $('.js-author').html(this.renderAuthorName());
            }
        },


        renderAuthorName: function() {
            var html = _.reduce(this.authors, function(memo, author, index, list) {
                if (index === list.length - 1) {
                    return memo + '<span style="color:' + author.color + '">' + author.name + '</span>'
                }

                return memo + '<span style="color:' + author.color + '">' + author.name + ', </span>'
            }, '');

            return html;
        },


        renderCloseBtn: function() {
            var html = '<button class="btn btn-primary js-close authorviz__close-btn">Close</button>',
                that = this;

            $('.js-left-panel').append(html);

            $(document).on('click', '.js-close', function() {
                $('.js-authorviz').addClass('hideVisually');

                // $(document).on('click', '.js-authorviz-btn', function() {
                //     // Show App
                //     $('.js-authorviz').removeClass('hideVisually');
                // });

                // $(document).on('click', '.js-docuviz-btn', function() {
                //     // Show App
                //     $('.js-authorviz').removeClass('hideVisually');
                // });


            });
        },


        renderPrintBtn: function() {
            var html = '<button class="btn btn-primary-alt js-print authorviz__print-btn">Print</button>',
                that = this;

            $('.js-left-panel').append(html);

            $(document).on('click', '.js-print', function() {
                var printContent = $('.js-result');
                var printWindow = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
                printWindow.document.write($('.js-author').html() + printContent.html());
                console.log(printContent.html());
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            });
        },


        renderResultPanel: function(html) {
            $('.js-result').html(html);
        },


        renderResultPanelForDocuviz: function(chars, revData) {


            var margin = {
                    top: 160,
                    right: 20,
                    bottom: 20,
                    left: 60
                },
                width = 1280 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

            var barHeight = 10; // author bar height

            var data = _.map(revData, function(val) {
                var timeRev = new Date(val[1].timestamp2);
                var parseTime = timeRev.toISOString();
                var parseDate = new Date(parseTime);
                //var dayDate = parseDate.toLocaleString();
                return {
                    revLength: val[0],
                    revAuthor: val[2],
                    revTime: parseDate,
                    revSegments: val[3],
                }
            });

            var authorsColors = [];

            _.each(data, function(val) {
                var colorLoop = [];
                _.each(val.revAuthor, function(val2) {
                    colorLoop.push(val2.color);
                });

                authorsColors.push(colorLoop);
            });

            console.log(data);




            var x = d3.scale.ordinal().domain(d3.range(data.length)).rangeRoundBands([0, width], 0.5);
            var y = d3.scale.linear()
                .range([0, height]);

            y.domain([0, d3.max(data, function(d) {
                return d.revLength;
            })]);

            // console.log("Mininum is " + d3.min(data, function(d) { return d.revLength; }));

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("top")
                .tickFormat('');

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");


            var svg = d3.select($('.js-result')[0]).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + 10 + ")")
                .call(xAxis)
                .attr("fill","none");

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .attr("shape-rendering","crispEdges")
                .append("text")
                .attr("transform", "translate(" + 0 + "," + (height - 100) + ")" + "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Revision Length");


            // New version bag graph with segments:

            // Draw time label:

            var time_label = svg.selectAll("time_label").data(data).enter()
                .append("text")
                .attr("class", "time_label")
                .attr("x", 80)
                .attr("y", function(d, i) {
                    return x(i) + (x.rangeBand() / 2);
                })
                .attr("font-family", "sans-serif")
                .attr("font-size", "10px")
                .attr("fill", "black")
                .html(
                    function(d) {
                        return d.revTime.toString().substring(4, 10) + " " + d.revTime.toString().substring(16, 21);
                    })
                .attr("transform", "translate(0," + 15 + ") rotate(-90)");


            // Draw author legends:

            for (var index = 0; index < authorsColors.length; index++) {
                var currentColors = authorsColors[index][0];
                //deal with multi author
                svg.selectAll("authorLabel_" + index).data(authorsColors[index]).enter().append("rect")
                    .attr("class", "author_label")
                    .attr("x", function() {

                        return x(index);
                    })
                    .attr("y", function(d, i) {
                        return (i * (barHeight + 1)) - 120;
                    })

                .attr("width", x.rangeBand())
                    .attr("height", barHeight)
                    .style("fill", function(d, i) {
                        return d;
                    })
                    .attr("transform", "translate(0," + (6 * barHeight) + ")");
            }




            _.each(data, function(rev, index) {
                var segStartIndex = 0;
                var soFarSegmentsLength = 0;

                svg.selectAll(".bar").data(rev.revSegments).enter()
                    .append("rect")
                    .attr("x", function(d, i) {
                        return x(index);
                    })
                    .attr("y", function(d, i) {
                        segStartIndex = y(soFarSegmentsLength);
                        //soFarSegmentsLength = soFarSegmentsLength + d[1].length;
                        soFarSegmentsLength = soFarSegmentsLength + d.segLength;
                        return segStartIndex;
                    })
                    .attr("width", x.rangeBand())
                    .attr("height", function(d, i) {
                        //console.log(d[1].length);
                        //return y(d[1].length);
                        return y(d.segLength);
                    })
                    .style("fill", function(d) {
                        //return d[0].color;
                        return d.authorColor;
                    });
            });

        // compute link 
        var link = [], preSegment = [], newSegment = [], preIndex = -1;



        // var locateSegmentWithID = function(segmentsArray, segID) {
        //     if (segmentsArray.length === 0){
        //         return -1;
        //     }
        //     else {
        //         _.each(segmentsArray, function(eachSegment, index){
        //             if (eachSegment.segID === segID){ 
        //                 return index;
        //             }
        //         });
        //         return -1;
        //     }
        // };

        for (var j = 0; j < data.length - 1; j++) {
            link[j] = [];//link[j] represent the link between revision j and j+1
            preSegment = data[j].revSegments; //revision j segments
            newSegment = data[j + 1].revSegments; //revision j+1 segments
            //iterate revision j+1 segments to find father segment (segmentId) or it own(-1) in the previous revision
            for (var k = 0; k < newSegment.length; k++) {
                // If fatherSegmentIndex<0, it is not a child segment, either has a link to itself, or no link
                if (newSegment[k].parentSegID < 0) {

                    //preIndex = preSegment.indexOf(newSegment[k]);
                    if (preSegment.length != 0){
                        _.each(preSegment, function(eachSegment, index){                          
                            if (eachSegment.segID === newSegment[k].segID){ 
                                console.log("found");
                                // preIndex = index;
                                link[j].push([ eachSegment, newSegment[k] ]);
                            }
                        });
                    }
                    // //preIndex = -1 means that the segment is not in the previous revision
                    // if (preIndex != -1) {
                    //     link[j].push([ preSegment[preIndex], newSegment[k] ]);
                    // } else {
                    //     //No link
                    // }
                } 
                else {
                    // fatherSegmentIndex>0 it's a child segment, need to calculate the offset and position
                    if (preSegment.length != 0){
                        _.each(preSegment, function(eachSegment, index){
                            if (eachSegment.segID === newSegment[k].segID){ 
                                link[j].push([ eachSegment, newSegment[k] ]);
                                
                            }
                            else if (eachSegment.segID === newSegment[k].parentSegID){
                                preIndex = index;
                            }
                        });
                    }                 
                    //If preindex != -1 means, the father is in previous revision, so link the fathter segment and child segment
                    if (preIndex != -1) {
                        link[j].push([ preSegment[preIndex], newSegment[k] ]);
                        preIndex = -1;
                    }
                    else {
                        // if (preSegment.length != 0){
                        //     _.each(preSegment, function(eachSegment, index){
                        //         if (eachSegment.segID === newSegment[k].segID){ 
                        //             preIndex = index;
                        //         }
                        //     });
                        // }
                        // if (preIndex != -1) {
                        //     link[j]
                        //     .push([ preSegment[preIndex], newSegment[k] ]);
                        // } else {
                        //     // means it has a father, but it's not in previous version,
                        //     alert("link compute error" + preIndex + " "
                        //         + newSegment[k].segID);
                        // }
                    }
                }
            }// End of Segments  for-loop
            // If there's no link at all, put a empty link for visualize reason
            if (link[j].length == 0) {
                link[j].push([ -1, -1 ]);
            }
        }// End of revision for-loop to compute the links


        // Link rectangles
        var linkGroups = svg.selectAll("linkGroup").data(link).enter()
            .append("g")
            .attr("class", "linkGroup");
        // For d
        var linkRevisionIndex = -1;
        // For rev
        var linkRevisionIndex2 = -1;

        linkGroups
            .selectAll("link")
            .data(function(d) {
                return d;
            })
            .enter()
            .append("path")
            .attr("class", "link")
            .attr(
                "d",
                function(d, i) {
                    if (i == 0) {
                        linkRevisionIndex++;
                        accumulateSegLength1 = 0;
                        accumulateSegLength2 = 0;
                    }
                    // If d[1] = -1 means it has only an empty link (-1,-1)
                    if (d[1] == -1) {
                        return "";
                    } else {
                        var x0 = x(linkRevisionIndex) + x.rangeBand();
                        var tempSegments1 = data[linkRevisionIndex].revSegments;
                        var tempSegments2 = data[linkRevisionIndex + 1].revSegments;

                        var index1 = tempSegments1.indexOf(d[0]);
                        var index2 = tempSegments2.indexOf(d[1]);

                        var accumulateSegLength1 = 0, accumulateSegLength2 = 0;

                        for (var q = 0; q < index1; q++) {
                            accumulateSegLength1 += tempSegments1[q].segLength;
                        }
                        for (var q = 0; q < index2; q++) {
                            accumulateSegLength2 += tempSegments2[q].segLength;
                        }

                        if (d[1].segID === d[0].segID) {
                            var y0 = y(accumulateSegLength1);
                        } else {
                            var y0 = y(accumulateSegLength1
                                + d[1].offset);
                        }
                        var y1 = y(accumulateSegLength2);

                        var x1 = x0 + x.rangeBand();
                        var dy = y(d[1].segLength);

                        return "M " + x0 + "," + y0 + " " + x0
                        + "," + (y0 + dy) + " " + x1 + ","
                        + (y1 + dy) + " " + x1 + "," + y1
                        + "Z";
                    }
            })
            .attr("rev", function(d, i){
                if (i == 0) {
                    linkRevisionIndex2++;
                }
                return linkRevisionIndex2;
            })
            .attr("fill", function(d, i) {
                if (d[1] != -1)
                    return d[1].authorColor;
            })
            .attr("opacity", 0.8);
            





            // this.renderPath(chars, data);
        },





    });


    // When Google Doc is finished loading, initialize authorViz app
    authorviz.init();


    // These methods are provided by Chrome API
    // chrome.runtime.onMessage method listen to the Model. Whenever Model wants to send data over to View, this method will activate and listen the call
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            switch (request.msg) {
                case 'progress':
                    authorviz.renderProgressBar(request.soFar, request.outOf);
                    sendResponse('done');
                    break;

                case 'render':
                    authorviz.renderResultPanel(request.html);
                    sendResponse('end');
                    break;

                case 'renderDocuviz': // this is when the Docuviz button is pressed
                    authorviz.renderResultPanelForDocuviz(request.chars, request.revData);
                    sendResponse('end');
                    break;

                default:
            }
        });
}());