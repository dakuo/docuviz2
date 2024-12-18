// Docuviz Annotations
// _____________________________
//
// BB: means Black Box. When you see this, it means you don't need to care about what goes inside the methods. It is because the method name is self-explanatory and inside is complex. The methods do what they supposed to do


// Reserve the "$" character to only be use as a call to to jQuery
// e.g. instead of writing "jQuery.someMethods", you can write "$.someMethods"
var $ = jQuery.noConflict()

// If authorviz is already exist, use it. Otherwise make a new object
window.docuviz = window.docuviz || {}


// Add new properties to the existing object's properties
$.extend(window.docuviz, {
    // Store each author object in the document
    // Each author object will have a unique ID, color, and name
    authors: [],
    revAuthors: [],
    revTimestamps: [],
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
        chrome.runtime.sendMessage({
            msg: 'setToken'
        });
    },


    // Set Revision Number to corresponded elements
    setRevisionNumber: function(num) {
        $('.js-revision-number-docuviz').add('.js-revision-out-of-docuviz').text(num);
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

        if (switchUrl === 0) {
            http = http.replace('/d/', '/u/1/d/');
        }
        else if(switchUrl > 0)
        {
            http = http.replace('/u/1/d/', '/u/0/d/');
        }
        else{

        }

        historyUrl = http + '/revisions/tiles?id=' + this.getDocId() + "&token=" + token + "&start=1&showDetailedRevisions=false";
        // console.log("historyUrl is at: ");
        // console.log(historyUrl);
        return historyUrl;
    },


    // Ajax call to get Google Doc's history data which contains revision number and authors data
    getHistoryData: function(url) {
        var that = this;
        var errorCounter = 0;

        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'html',

            // If the Ajax call failed, make another call using a different url
            error: function(request, error) {
                var historyUrl = null;

                if (request.status === 400) {
                    historyUrl = that.getHistoryUrl(location.href, errorCounter);
                    that.getHistoryData(historyUrl);

                    errorCounter++;
                }
                else{

                }
            },

            // If the call success, turn the result DATA into JSON object and get the important information (Revision number & authors data)
            success: function(data) {
                var raw = jQuery.parseJSON(data.substring(4)),
                    // revisionNumber = raw[2][raw[2].length - 1][3];
                    revisionNumber = raw.tileInfo[raw.tileInfo.length-1].end;

                that.setRevisionNumber(revisionNumber);
                //$('.js-authorviz-btn').removeClass('is-disabled');
                $('.js-docuviz-btn').removeClass('is-disabled');

                that.authors = that.parseAuthors(raw.userMap); // set list of authors
                that.parseRevTimestampsAuthors(raw.tileInfo, that.authors); // set an array of authors which correspond for revisions' time

            }
        })
    },


    // parseAuthors method receive "raw authors" data (JSON Object) and maniputlate on that JSON Object to return a set of structural Author Object.
    // ** BB
    parseAuthors: function(userMap) {
        var 
            authors = [];

        // Author is a factory that creat "author object" a set of structural property and value.
        // If you come from Programming language like Java, C, C++, Python, think of this Author as a Class used to create as many author children as needed
        var Author = function(name, color, id) {
            return {
                name: name,
                color: color,
                id: id
            };
        };
        //set my own range of colors. Using the first 10 colors from category10 and then alternating between every other color
        //found in category 20.

        //old code
        // var d3Color = d3.scale.category20();

        var colorArray = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
            "#8c564b", "#e377c2", "#7B8A91", "#bcbd22", "#17becf", "#aec7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5", "#bd9e39",
            "#e6550d", "#637939", "#aa2287", "#fed000", "#cedb9c", "#393b79", "#E71AC9", "#FEFC5A", "#c18A61", "#A6B1A5",
            "#8743fd", "#517EB8", "#014D0B", "#B90367", "#C54d07" ];

        
        //check size of users and use math to append more colors to colorarray based on the number of users.
        //ex: 80 users. colorArray.append(80-30(50 colors of gray into the colorArray))
            
        //new code
        var d3Color = d3.scale.category20().range(colorArray);
        //colors will repeat if more than 20 authors. range can accomodate for more than 20 colors in the array of hex colors.
    

        _.each(Object.keys(userMap), function(d, i){

            if (userMap[d].anonymous === true){
                //need to keep track of all unique anonymous users.
                authors.push(Author("Anonymous Author(s)", "#D3D3D3", d));
            }
            else if (i > 30){
                authors.push(Author(userMap[d].name, "#a8a8a8", d));
            }
            else{
                authors.push(Author(userMap[d].name, d3Color(i), d));
            }
        });
        return authors;
    },

    // 
    parseRevTimestampsAuthors: function(tileInfo, authors) {
        var that = this,
            rawData,
            i,
            rawAuthors = [],
            //  authors = [],
            authorId = [];
        //timestamps = [];

        // Author is a factory that create "author object" a set of structural property and value.
        // If you come from Programming language like Java, C, C++, Python, think of this Author as a Class used to create as many author children as needed
        // var Author = function(name, color, id) {
        //     return {
        //         name: name,
        //         color: color,
        //         id: id
        //     };
        // };

        // var timeStamp = function(timestamp1, timestamp2) {
        //     return {
        //         timestamp1: timestamp1,
        //         timestamp2: timestamp2
        //     };
        // };

        _.each(tileInfo, function(tile) {
            var authorsArray = [];
            _.each(tile.users, function(eachAuthor) {

                var author = _.find(authors, function(val) {
                    return eachAuthor === val.id;
                });

                authorsArray.push(author);
            });

            that.revTimestamps.push(tile.endMillis);
            that.revAuthors.push(authorsArray);


        });
    },


    getDocTitle: function() {
        // return $('#docs-title-inner').text();
        // Updated version on Aug 11, 2015:
        return $('.docs-title-input').val();
    },


    getRevisionNumber: function() {
        return $('.js-revision-number-docuviz').text();
    },


    // Construct an URL to retrieve Changelog Data
    // ** BB

    getChangelogUrlForDocuviz: function() {
        var regmatch = location.href.match(/^(https:\/\/docs\.google\.com.*?\/document\/d\/)/),
            baseUrl = regmatch[1],
            loadUrl = baseUrl + this.getDocId() + "/revisions/load?id=" + this.getDocId() + "&start=1&end=" + parseInt(('' + this.getRevisionNumber()).replace(/,/g, '')) + "&token=" + this.getToken();
        // console.log('got changelogURL for Docuviz: ' + loadUrl);
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
                // console.log('GOT changelog data')
                var raw = jQuery.parseJSON(data.substring(4));
                // Send Changelog data to Model
                //console.log(data);
                chrome.runtime.sendMessage({
                    msg: 'changelog',
                    vizType: vizType,
                    docId: that.getDocId(),
                    changelog: raw.changelog,
                    authors: that.authors,
                    revTimestamps: that.revTimestamps,
                    revAuthors: that.revAuthors
                }, function(data) {});
                // chrome.runtime.sendMessage({msg: 'buildRevLengths', changelog: raw.changelog, timeStamp: that.timestamps[0]}, function(data){});
            },
            error: function(error) {
                console.log(error.status);
            }
        });
    },


    // Bind Click Event onto the Docuviz Button
    addListenerToDocuvizBtn: function() {
        var that = this;

        // When the button is click, show the app and disable this button
        $(document).on('click', '.js-docuviz-btn', function() {
            var changelogUrl = null;
            $('.js-result-docuviz').html('')
            // Make the App Visible to user
            $('.js-docuviz').removeClass('hideVisually');
            // $('.js-progress-bar').removeClass('hideVisually');
            // console.log('got docuviz');

            changelogUrl = that.getChangelogUrlForDocuviz(location.href);
            that.getChangelog(changelogUrl, 'docuviz');

            //Remove the click event from Docuviz button
            $(document).off('click', '.js-docuviz-btn');
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

        var html = '<div class="docuviz js-docuviz hideVisually"><div class="docuviz__layout"><div class="l-half-docuviz l-half--top-docuviz docuviz__wrap--top"><div class="aligner-docuviz txt-c js-left-panel-docuviz" style="height: 100%"><div class="aligner-item-docuviz docuviz__intro"><div class="aligner-item-docuviz aligner-item-top-docuviz"><h3 class="docuviz__doc-title js-doc-title-docuviz">Final Paper</h3><div class="js-author-docuviz docuviz__author"></div></div><div class="aligner-item-docuviz js-progress-bar-docuviz"><div class="docuviz__progress-bar"><div class="docuviz__progress-bar-item js-progress-so-far-docuviz"></div></div><p class="docuviz__loading-text">Loading <span class="js-revision-so-far-docuviz">0</span>/<span class="js-revision-out-of-docuviz">?</span> changes</p></div></div></div></div><div class="l-half-docuviz l-half--bottom-docuviz docuviz__wrap--bottom"><div class="docuviz__box js-result-docuviz"></div></div></div></div>';

        $('body').prepend(html);

        this.renderDocuvizBtn();

        // Update Document Title
        $('.js-doc-title-docuviz').text(this.getDocTitle());

    },


    renderDocuvizBtn: function() {
        var btnGroup = $('#docs-titlebar-share-client-button').prev();

        // js-authorviz: feature btn
        // js-revision-number: revision number
        $('<div class="goog-inline-block js-docuviz-btn is-disabled"><div role="button" class="goog-inline-block jfk-button jfk-button-standard docs-titlebar-button jfk-button-clear-outline" aria-disabled="false" aria-pressed="false" tabindex="0" data-tooltip="Docuviz" aria-label="Docuviz" value="undefined" style="-webkit-user-select: none;">DocuViz (<span class="js-revision-number-docuviz">loading</span> changes)</div><div id="docs-docos-caret" style="display: none" class="docos-enable-new-header"><div class="docs-docos-caret-outer"></div><div class="docs-docos-caret-inner"></div></div></div>').prependTo(btnGroup);
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

        $('.js-progress-so-far-docuviz').css("width", progressSoFar + '%');
        $('.js-revision-so-far-docuviz').text(soFar);

        // When progress bar is fully loaded, do something
        if (progressSoFar === 100) {
            this.loaded = true;
            this.renderCloseBtn();
            this.renderPrintBtn();
            $('.js-progress-bar-docuviz').addClass('hideVisually');
            $('.js-author-docuviz').html(this.renderAuthorName());
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
        var html = '<button class="btn-docuviz btn-primary js-close-docuviz docuviz__close-btn">Close</button>',
            that = this;

        $('.js-left-panel-docuviz').append(html);

        $(document).on('click', '.js-close-docuviz', function() {
            //$('.js-result').addClass('hideVisually');
            $('.js-docuviz').addClass('hideVisually');


            $(document).on('click', '.js-docuviz-btn', function() {
                // Show App
                $('.js-docuviz').removeClass('hideVisually');
                //$('.js-result').removeClass('hideVisually');
            });


        });
    },


    renderPrintBtn: function() {
        var html = '<button class="btn-docuviz btn-primary-alt js-print-docuviz docuviz__print-btn">Print</button>',
            that = this;

        $('.js-left-panel-docuviz').append(html);

        $(document).on('click', '.js-print-docuviz', function() {
            //$("svg").attr('viewBox','0 100 1600 800');
            //var newWidth = parseInt($("svg").attr("width")) + parseInt(100);
            $("svg")[0].setAttribute('viewBox', '0 0 1000 800');
            var printContent = $('.js-result-docuviz svg');



            var printWindow = window.open('', '', 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');
            // printWindow.document.write($('.js-author-docuviz').html() + '<svg width=1200 height=600>' + printContent.html() + '<svg>');
            printWindow.document.write($('.js-doc-title-docuviz').html() + '</br>' + $('.js-author-docuviz').html() + '</br>' + '<svg width=1200 height=1000>' + printContent.html() + '<svg>');
            //console.log(printContent.html());
            $("svg")[0].removeAttribute('viewBox');
            //$('.js-result-docuviz').prepend(chartComponent.html());

            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        });
    },


    renderResultPanel: function(html) {
        $('.js-result-docuviz').html(html);
    },


    renderResultPanelForDocuviz: function(chars, revData) {
        var initial_render_revision_amount = 100;
        var rendered_revision_counter_end = initial_render_revision_amount;

        var margin = {
                top: 150,
                right: 60,
                bottom: 480,
                left: 60
            },

            width = 1280 - margin.left - margin.right,
            height = 1000 - margin.top - margin.bottom;

        // width and height values below are for vizsualization that can scale for any screen resolution:
        //width = $(window).width() - margin.left - margin.right - 150,
        //height = $(window).height() - margin.top - margin.bottom - ($(window).height()/10 * 2);


        var barHeight = 10; // author bar height

        var data = _.map(revData, function(val) {
            var timeRev = new Date(val[1]);
            var parseTime = timeRev.toISOString();
            var parseDate = new Date(parseTime);
            return {
                revLength: val[0],
                revAuthor: val[2],
                revTime: parseDate,
                revSegments: val[3],
                revStatsData: val[4],
            }
        });


        var dateArray = data.map(function(eachRevision) {
            return eachRevision.revTime;

        });

        var authorsColors = [];

        _.each(data, function(val) {
            var colorLoop = [];
            _.each(val.revAuthor, function(val2) {
                colorLoop.push(val2.color);
            });

            authorsColors.push(colorLoop);
        });

        /**
         * Timescale v.s. Equal Distance switch
         **/
        $('.js-result-docuviz').append('<section class="chart-component"></section>')
        $('.chart-component').append('<section class="chart__controller"></section>')
        $('.chart__controller').append("<div class='controller__btn-wrap'></div>")
        $('.controller__btn-wrap').append('<button class="btn btn-primary" id="equal-distance-btn">Equal Distance</button>');
        $('.controller__btn-wrap').append('<button class="btn btn-primary" id="time-scaled-btn">Time Scaled</button>');



        /**
         * Slider
         **/
        $('.chart__controller').append("<div class='slider-bar-wrap'></div>")
        var slider = $('.slider-bar-wrap').append("<div id='slider' style='width:910px;'></div>") //.attr("id","slider");
        var revision_index_label = $('.slider-bar-wrap').append("<label for='revision_index'></label>") //.attr("for","revision_index");
        var revision_index = $('.slider-bar-wrap').append("<input id='revision_index'></input>") //.attr("id","revision_index");


        var beginRev = 1;
        var endRev = data.length;
        var currentChartType = 'equalDistance';
        /**
         * Slider to interact with historyflow
         **/
        $("#slider").slider({
            range: true,
            min: 1,
            max: data.length,
            values: [1, data.length],
            slide: function(event, ui) {
                $("#revision_index").val("Revision: " + ui.values[0] + " - Revision: " + ui.values[1]);

                setTimeout(function() {
                    sliderMethod(event, ui);
                }, 200); // delay trigger for 0.2s
            }
        });

        function sliderMethod(event, ui) {
            /*
             ** Interact with the filter
             */
            beginRev = ui.values[0];
            endRev = ui.values[1];

            if (currentChartType === 'equalDistance') {
                $('svg').remove();
                docuviz.drawEqualDistance(data, margin, width, height, barHeight, authorsColors, beginRev, endRev);
            } else {
                $('svg').remove();
                docuviz.drawTimeScaled(data, margin, width, height, barHeight, authorsColors, beginRev, endRev);
            }
        }

        /*
         ** Slider label
         */
        $("#revision_index").attr("style", "height:26px;width:185px;").val("Revision " + $("#slider").slider("values", 0) +
            " to Revision " + $("#slider").slider("values", 1));


        // at first, draw a intital graph with equal distance
        this.drawEqualDistance(data, margin, width, height, barHeight, authorsColors, beginRev, endRev);
        $('#equal-distance-btn').css({
            'background': '#E25A5A',
            'color': 'white'
        });
        var timeScaledGraph = null;

        var equalDistanceGraph = $('svg').html();
        document.getElementById('equal-distance-btn').onclick = function() { // if equal distance button is clicked
            currentChartType = 'equalDistance';
            $('#time-scaled-btn').removeAttr('style');
            $('svg').remove();
            $('#equal-distance-btn').css({
                'background': '#E25A5A',
                'color': 'white'
            });
            docuviz.drawEqualDistance(data, margin, width, height, barHeight, authorsColors, beginRev, endRev);
        };


        document.getElementById('time-scaled-btn').onclick = function() { // if time scaled button is clicked

            if (timeScaledGraph === null) {
                $('#equal-distance-btn').removeAttr('style');
                $('svg').remove();
                $('#time-scaled-btn').css({
                    'background': '#E25A5A',
                    'color': 'white'
                });
                currentChartType = 'timeScaled';
                docuviz.drawTimeScaled(data, margin, width, height, barHeight, authorsColors, beginRev, endRev);
                timeScaledGraph = $('svg').html();
                
            } else {
                $('#equal-distance-btn').removeAttr('style');
                $('svg').remove();
                $('#time-scaled-btn').css({
                    'background': '#E25A5A',
                    'color': 'white'
                });
                currentChartType = 'timeScaled';
                docuviz.drawTimeScaled(data, margin, width, height, barHeight, authorsColors, beginRev, endRev);
                timeScaledGraph = $('svg').html();
            }
        };
    },

    drawEqualDistance: function(data, margin, width, height, barHeight, authorsColors, beginRev, endRev) {
        function filterRevisionArray(value, index) {
            return (index >= beginRev - 1) && (index <= endRev - 1);
        }
        var data = data.filter(filterRevisionArray);
        var authorsColors = authorsColors.filter(filterRevisionArray);

        var x = d3.scale.ordinal().domain(d3.range(data.length)).rangeRoundBands([0, width], 0.5);

        var y = d3.scale.linear()
            .range([0, height]);

        y.domain([0, d3.max(data, function(d) {
            return d.revLength;
        })]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("top")
            .tickFormat('');

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");


        var svg = d3.select($('.js-result-docuviz')[0]).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + 10 + ")")
            .call(xAxis)
            .attr("fill", "none");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .attr("shape-rendering", "crispEdges")
            .append("text")
            .attr("transform", "translate(" + 0 + "," + (height - 100) + ")" + "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Rev Length (characters)");

        // show the revision's total length, Nov 02, 2015 by Dakuo
        // the yAxis ending tick
        var format = d3.format(",");
        svg.append("text").attr("class","ending_tick").attr("transform",
            "translate(-43," + (height+15) + ")").text(format(d3.max(data, function(d) {
                return d.revLength;
            })));

        // Draw time labels:
        var lastYvalue = 0;
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
                    var tempYvalue = d.revTime;
                    if (Math.abs(tempYvalue - lastYvalue) > 10 || (tempYvalue - lastYvalue) === 0){
                        lastYvalue = tempYvalue;
                        return d.revTime.toString().substring(4, 10) + " " + d.revTime.toString().substring(16, 21);
                    }
                })
            .attr("transform", "translate(4," + 15 + ") rotate(-90)");


       // Draw author labels:
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


        // begin draw new statistic table
        var columnTitles = ['','Name', 'Edit of Self', 'Edit of Other','Total Edit', 'Contribution'];
        var columnVarNames = ['authorColor','authorName', 'selfEdit', 'otherEdit','totalEdit', 'authorContribution'];

        function statisticDataObject (authorColor,authorName, authorId, selfEdit, otherEdit, totalEdit, authorContribution){
            return {
                authorColor: authorColor,
                authorName: authorName,
                authorId: authorId,
                selfEdit: selfEdit,
                otherEdit: otherEdit,
                totalEdit: totalEdit,
                authorContribution: authorContribution
            }
        }

        var theLastRevStatsData = [];
        var allRevsStatsData = [];

        _.each(data[data.length-1].revStatsData, function(eachAuthor){
            theLastRevStatsData.push(statisticDataObject(eachAuthor.authorColor, eachAuthor.authorName, eachAuthor.authorId, eachAuthor.selfEdit, eachAuthor.otherEdit, eachAuthor.totalEdit,eachAuthor.authorContribution));
        });

        _.each(data, function(eachRevision){
            allRevsStatsData.push(eachRevision.revStatsData);
        });

        _.each(theLastRevStatsData, function(eachAuthor, index){
            var sumSelfEdit = 0, sumOtherEdit = 0, sumTotalEdit = 0;
            _.each(allRevsStatsData, function(eachRevision){
                sumSelfEdit += eachRevision[index].selfEdit;
                sumOtherEdit += eachRevision[index].otherEdit;
                sumTotalEdit += eachRevision[index].selfEdit + eachRevision[index].otherEdit;

            });
            theLastRevStatsData[index].selfEdit = sumSelfEdit;
            theLastRevStatsData[index].otherEdit = sumOtherEdit;
            theLastRevStatsData[index].totalEdit = sumTotalEdit;

        });

        var statisticsTable = svg.append("foreignObject")
                            .attr("width",705)
                            .attr("height", 500)
                            .attr(
                                "transform",
                                "translate(" + (margin.left)
                                    + "," + (height - 10 + (barHeight*4 ) ) + ")")
                            .append("xhtml:body")
                            .append("table")
                            .attr("border", 1)
                            .attr("border-spacing", 0)
                            .attr("font-family", "sans-serif")
                            .attr("font-size", "10px");

            statisticsTable.append('thead')
                            .append("tr")
                            .selectAll("th")
                            .data(columnTitles).enter()
                            .append("th")
                            .html(function(d){

                                if (d==="Edit of Self"){
                                    return '<a class="tooltip" title="How many characters that were inserted/deleted within the content contributed by himself/herself.">Edit of Self</a>';
                                }
                                else if (d==="Edit of Other"){
                                    return '<a class="tooltip" title="How many characters that were inserted/deleted within the content contributed by others.">Edit of Other</a>';
                                }
                                else if (d==="Total Edit"){
                                    return '<a class="tooltip" title="How many characters that were inserted/deleted in total. For example, if Alice inserted 500 characters and then deleted those 500 characters, it will be counted as 1,000 edits.">Total Edit</a>';
                                }
                                else if (d==="Contribution"){
                                    return '<a class="tooltip" title="How many characters that were left in the final draft.">Contribution</a>';
                                }
                                else{
                                    return '<a>' + d + '</a>';
                                }
                            });

            statisticsTable.append('tbody')
                            .selectAll('tr')
                            .data(theLastRevStatsData).enter()
                            .append('tr')
                            .attr('height', 25)
                            .selectAll('td')
                            .data(function(row) {
                                return columnVarNames.map(function(column) {
                                    return {column: column, value: row[column]};
                                });
                            }).enter()
                            .append('td')
                            .attr('width', function(d,i){
                                if (i===0){ // color
                                   return 55;
                                }
                                else if (i===1 || i===2 || i===3){ // name
                                    return 150;
                                }
                                else{
                                    return 120;
                                }
                            })
                            .attr('height', 25)
                            .html(function(d,i) { 
                                if (i === 0){
                                    return;
                                }
                                else if (i === 1){
                                    return d.value.substring(0,15);
                                }
                                else{
                                    return ('<center>' + d.value + '</center>'); 
                                }
                            });

        var totalRow = {title: 'Total', totalEditInSelf: 0, totalEditinOthers: 0, totalTotalEdit: 0, totalAuthorContribution: 0};
        _.each(theLastRevStatsData, function(eachAuthor){
            totalRow.totalEditInSelf += eachAuthor.selfEdit;
            totalRow.totalEditinOthers += eachAuthor.otherEdit;
            totalRow.totalTotalEdit += eachAuthor.totalEdit;
            totalRow.totalAuthorContribution += eachAuthor.authorContribution;
        })

        statisticsTable.append('tr')
                    .selectAll('td')
                    .data(columnVarNames).enter()
                    .append('td')
                    .html(function(d,i) { 
                        if (i === 1){
                            return '<center><strong>' + totalRow.title + '</strong></center>';
                        }
                        else if (i=== 2){
                            return '<center><strong>' + totalRow.totalEditInSelf + '</strong></center>';
                        }
                        else if (i===3){
                            return '<center><strong>' + totalRow.totalEditinOthers + '</strong></center>';
                        }

                        else if (i===4){
                            return '<center><strong>' + totalRow.totalTotalEdit + '</strong></center>';
                        }
                        else if (i===5){
                            return '<center><strong>' + totalRow.totalAuthorContribution + '</strong></center>';
                        }
                        else{

                        }
                    });

        // Draw authors' colors to the table:

        svg.selectAll("authorRectangle").data(data[data.length-1].revStatsData).enter()
        .append("rect")
        .attr("class", "author_label")
        .attr("x", 63)
        .attr("y", function(d, i) {
            return (i * 25) + (i*2);
        })
        .attr("width", 46)
        .attr("height", 22)
        .style("fill",  function(d,i){
            return d.authorColor;
        })
        .attr(
            "transform",
            "translate(" + (0)
                + "," + (height + 60) + ")");




        // end draw new statictic table
                            
        _.each(data, function(rev, index) {
            var segStartIndex = 0;
            var soFarSegmentsLength = 0;

            svg.selectAll(".bar").data(rev.revSegments).enter()
                .append("svg:rect")
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
                    return y(d.segLength);
                })
                .style("fill", function(d) {
                    //return d[0].color;
                    return d.authorColor;
                })
                .append("svg:title").text(function(d, i) {
                    return d.segStr
                });
            // For debugging: 
            //.append("svg:title").text(function(d,i) { return d.segStr + ' - Seg ID: ' + d.segID + ' - parentSegID: ' + d.parentSegID + ' - offset: ' + d.offset + ' - index: ' + i; });
        });

        // compute link 
        var link = [],
            preSegments = [],
            newSegments = [],
            preIndex = -1;


        for (var j = 0; j < data.length - 1; j++) {
            link[j] = []; //link[j] represent the link between revision j and j+1
            preSegments = data[j].revSegments; //revision j segments
            newSegments = data[j + 1].revSegments; //revision j+1 segments
            //iterate revision j+1 segments to find father segment (segmentId) or it own(-1) in the previous revision
            for (var k = 0; k < newSegments.length; k++) {
                // If fatherSegmentIndex<0, it is not a child segment, either has a link to itself, or no link
                if (newSegments[k].parentSegID < 0) {

                    //preIndex = preSegment.indexOf(newSegments[k]);
                    if (preSegments.length != 0) {
                        _.each(preSegments, function(eachSegment, index) {
                            if (eachSegment.segID === newSegments[k].segID) {
                                // preIndex = index;
                                link[j].push([eachSegment, newSegments[k]]);
                            }
                        });
                    }

                } else {
                    // fatherSegmentIndex>0 it's a child segment, need to calculate the offset and position
                    if (preSegments.length != 0) {
                        _.each(preSegments, function(eachSegment, index) {
                            if (eachSegment.segID === newSegments[k].segID) {
                                link[j].push([eachSegment, newSegments[k]]);

                            } else if (eachSegment.segID === newSegments[k].parentSegID) {
                                preIndex = index;

                            }
                            else {

                            }
                        });
                    }
                    //If preindex != -1 means, the father is in previous revision, so link the fathter segment and child segment
                    if (preIndex != -1) {
                        link[j].push([preSegments[preIndex], newSegments[k]]);
                        preIndex = -1;
                    } else {

                    }
                }
            } // End of Segments  for-loop
            // If there's no link at all, put a empty link for visualize reason
            if (link[j].length == 0) {
                link[j].push([-1, -1]);
            }
        } // End of revision for-loop to compute the links


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

                        var accumulateSegLength1 = 0,
                            accumulateSegLength2 = 0;

                        for (var q = 0; q < index1; q++) {
                            accumulateSegLength1 += tempSegments1[q].segLength;
                        }
                        for (var q = 0; q < index2; q++) {
                            accumulateSegLength2 += tempSegments2[q].segLength;
                        }

                        if (d[1].segID === d[0].segID) {
                            var y0 = y(accumulateSegLength1);
                        } 
                        else {
                            var y0 = y(accumulateSegLength1 + d[1].offset);
                        }
                        var y1 = y(accumulateSegLength2);

                        var x1 = x0 + x.rangeBand();

                        var dy = y(Math.min(d[0].segLength, d[1].segLength));

                        return "M " + x0 + "," + y0 + " " + x0 + "," + (y0 + dy) + " " + x1 + "," + (y1 + dy) + " " + x1 + "," + y1 + "Z";
                    }
                })
            .attr("rev", function(d, i) {
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


            // setup tooltipster
            $('.tooltip').tooltipster({
               delay: 0,
               trigger: 'hover',
               iconDesktop: true,
               contentAsHTML: true,
               touchDevices: false
            });

    },


    drawTimeScaled: function(data, margin, width, height, barHeight, authorsColors, beginRev, endRev) {

        function filterRevisionArray(value, index) {
            return (index >= beginRev - 1) && (index <= endRev - 1);
        }
        var data = data.filter(filterRevisionArray);
        var authorsColors = authorsColors.filter(filterRevisionArray);


        var svg = d3.select($('.js-result-docuviz')[0]).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



        var minDate = data[0].revTime,
            maxDate = data[(data.length - 1)].revTime;
        var x = d3.time.scale().domain([minDate, maxDate])
            .range([0, width - margin.left - margin.right]);
        var barWidth = 5;
        var y = d3.scale.linear()
            .range([0, height]);

        y.domain([0, d3.max(data, function(d) {
            return d.revLength;
        })]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("top")
            .tickFormat('');

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");


        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + 10 + ")")
            .call(xAxis)
            .attr("fill", "none");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .attr("shape-rendering", "crispEdges")
            .append("text")
            .attr("transform", "translate(" + 0 + "," + (height - 100) + ")" + "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Rev Length (characters)");


        // show the revision's total length, Nov 02, 2015 by Dakuo
        // the yAxis ending tick
        var format = d3.format(",");
        svg.append("text").attr("class","ending_tick").attr("transform",
            "translate(-43," + (height+15) + ")").text(format(d3.max(data, function(d) {
                return d.revLength;
            })));


        // Draw time label:
        var lastYvalue = 0;
        var time_label = svg.selectAll("time_label").data(data).enter()
            .append("text")
            .attr("class", "time_label")
            .attr("x", 80)
            .attr("y", function(d, i) {
                return x(d.revTime);
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", "10px")
             .attr("fill", "black")
            .html(
                function(d) {
                    var tempYvalue = x(d.revTime);
                    if (Math.abs(tempYvalue - lastYvalue) > 10 || (tempYvalue - lastYvalue) === 0){
                        lastYvalue = tempYvalue;
                        return d.revTime.toString().substring(4, 10) + " " + d.revTime.toString().substring(16, 21);
                    }
                })
            .attr("transform", "translate(28," + 15 + ") rotate(-90)");

        // Draw author legends:

        for (var index = 0; index < authorsColors.length; index++) {
            var currentColors = authorsColors[index][0];
            //deal with multi author
            svg.selectAll("authorLabel_" + index).data(authorsColors[index]).enter().append("rect")
                .attr("class", "author_label")
                .attr("x", function() {
                    return x(data[index].revTime);
                })
                .attr("y", function(d, i) {
                    return (i * (barHeight + 1)) - 120;
                })
                .attr("width", 8)
                .attr("height", barHeight)
                .style("fill", function(d, i) {
                    return d;
                })
                .attr("transform", "translate(21," + (6 * barHeight) + ")");
        }

        // begin draw new statistic table
        var columnTitles = ['','Name', 'Edit of Self', 'Edit of Other','Total Edit', 'Contribution'];
        var columnVarNames = ['authorColor','authorName', 'selfEdit', 'otherEdit','totalEdit', 'authorContribution'];

        function statisticDataObject (authorColor,authorName, authorId, selfEdit, otherEdit, totalEdit, authorContribution){
            return {
                authorColor: authorColor,
                authorName: authorName,
                authorId: authorId,
                selfEdit: selfEdit,
                otherEdit: otherEdit,
                totalEdit: totalEdit,
                authorContribution: authorContribution
            }
        }

        var theLastRevStatsData = [];
        var allRevsStatsData = [];

        _.each(data[data.length-1].revStatsData, function(eachAuthor){
            theLastRevStatsData.push(statisticDataObject(eachAuthor.authorColor, eachAuthor.authorName, eachAuthor.authorId, eachAuthor.selfEdit, eachAuthor.otherEdit, eachAuthor.totalEdit,eachAuthor.authorContribution));
        });



        _.each(data, function(eachRevision){
            allRevsStatsData.push(eachRevision.revStatsData);
        });

        _.each(theLastRevStatsData, function(eachAuthor, index){
            var sumSelfEdit = 0, sumOtherEdit = 0, sumTotalEdit = 0;
            _.each(allRevsStatsData, function(eachRevision){
                sumSelfEdit += eachRevision[index].selfEdit;
                sumOtherEdit += eachRevision[index].otherEdit;
                sumTotalEdit += eachRevision[index].selfEdit + eachRevision[index].otherEdit;

            });
            theLastRevStatsData[index].selfEdit = sumSelfEdit;
            theLastRevStatsData[index].otherEdit = sumOtherEdit;
            theLastRevStatsData[index].totalEdit = sumTotalEdit;

        });

        var statisticsTable = svg.append("foreignObject")
                            .attr("width",705)
                            .attr("height", 500)
                            .attr(
                                "transform",
                                "translate(" + (margin.left)
                                    + "," + (height - 10 + (barHeight*4 )) + ")")
                            .append("xhtml:body")
                            .append("table")
                            .attr("border", 1)
                            .attr("border-spacing", 0)
                            .attr("font-family", "sans-serif")
                            .attr("font-size", "10px");

            statisticsTable.append('thead')
                            .append("tr")
                            .selectAll("th")
                            .data(columnTitles).enter()
                            .append("th")
                            // .attr('class', 'title')
                            // .text(function(title){return title;}
                            .html(function(d){
                                 if (d==="Edit of Self"){
                                     return '<a class="tooltip" title="How many characters that were inserted/deleted within the content contributed by himself/herself.">Edit of Self</a>';
                                 }
                                 else if (d==="Edit of Other"){
                                     return '<a class="tooltip" title="How many characters that were inserted/deleted within the content contributed by others.">Edit of Other</a>';
                                 }
                                 else if (d==="Total Edit"){
                                     return '<a class="tooltip" title="How many characters that were inserted/deleted in total. For example, if Alice inserted 500 characters and then deleted those 500 characters, it will be counted as 1,000 edits.">Total Edit</a>';
                                 }
                                 else if (d==="Contribution"){
                                     return '<a class="tooltip" title="How many characters that were left in the final draft.">Contribution</a>';
                                 }
                                 else{
                                     return '<a>' + d + '</a>';
                                 }
                            }
                            );

            statisticsTable.append('tbody')
                            .selectAll('tr')
                            .data(theLastRevStatsData).enter()
                            .append('tr')
                            .attr('height', 25)
                            .selectAll('td')
                            .data(function(row) {
                                return columnVarNames.map(function(column) {
                                    return {column: column, value: row[column]};
                                });
                            }).enter()
                            .append('td')
                            .attr('width', function(d,i){
                                if (i===0){ // color
                                   return 55;
                                }
                                else if (i===1 || i===2 || i===3){ // name
                                    return 150;
                                }

                                else{
                                    return 120;
                                }
                            })
                            .attr('height', 25)
                            .html(function(d,i) { 
                                if (i === 0){
                                    return;
                                }
                                else if (i === 1){
                                    return d.value.substring(0,15);
                                }
                                else{
                                    return ('<center>' + d.value + '</center>'); 
                                }
                            });

        var totalRow = {title: 'Total', totalEditInSelf: 0, totalEditinOthers: 0, totalTotalEdit: 0, totalAuthorContribution: 0};
        _.each(theLastRevStatsData, function(eachAuthor){
            totalRow.totalEditInSelf += eachAuthor.selfEdit;
            totalRow.totalEditinOthers += eachAuthor.otherEdit;
            totalRow.totalTotalEdit += eachAuthor.totalEdit;
            totalRow.totalAuthorContribution += eachAuthor.authorContribution;
        })

        statisticsTable.append('tr')
                    .selectAll('td')
                    .data(columnVarNames).enter()
                    .append('td')
                    .html(function(d,i) { 
                        if (i === 1){
                            return '<center><strong>' + totalRow.title + '</strong></center>';
                        }
                        else if (i=== 2){
                            return '<center><strong>' + totalRow.totalEditInSelf + '</strong></center>';
                        }
                        else if (i===3){
                            return '<center><strong>' + totalRow.totalEditinOthers + '</strong></center>';
                        }

                        else if (i===4){
                            return '<center><strong>' + totalRow.totalTotalEdit + '</strong></center>';
                        }
                        else if (i===5){
                            return '<center><strong>' + totalRow.totalAuthorContribution + '</strong></center>';
                        }
                        else{
                            
                        }
                        
                    });


        // Draw authors' colors to the table:

        svg.selectAll("authorRectangle").data(data[data.length-1].revStatsData).enter()
        .append("rect")
        .attr("class", "author_label")
        .attr("x", 63)
        .attr("y", function(d, i) {
            return (i * 25) + (i*2);
        })
        .attr("width", 46)
        .attr("height", 22)
        .style("fill",  function(d,i){
            return d.authorColor;
        })
        .attr(
            "transform",
            "translate(" + (0)
                + "," + (height + 60 ) + ")");

        // end draw new statictic table


        _.each(data, function(rev, index) {
            var segStartIndex = 0;
            var soFarSegmentsLength = 0;

            svg.selectAll(".bar").data(rev.revSegments).enter()
                .append("svg:rect")
                .attr("x", function(d, i) {
                    return x(data[index].revTime) - 5;
                })
                .attr("y", function(d, i) {
                    segStartIndex = y(soFarSegmentsLength);
                    soFarSegmentsLength = soFarSegmentsLength + d.segLength;
                    return segStartIndex;
                })
                .attr("width", 10)
                .attr("height", function(d, i) {
                    return y(d.segLength);
                })
                .attr("transform", "translate(25,0)")
                .style("fill", function(d) {
                    return d.authorColor;
                })
                .append("svg:title").text(function(d) {
                    return d.segStr;
                });
        });



        // compute link 
        var link = [],
            preSegments = [],
            newSegments = [],
            preIndex = -1;


        for (var j = 0; j < data.length - 1; j++) {
            link[j] = []; //link[j] represent the link between revision j and j+1
            preSegments = data[j].revSegments; //revision j segments
            newSegments = data[j + 1].revSegments; //revision j+1 segments
            //iterate revision j+1 segments to find father segment (segmentId) or it own(-1) in the previous revision
            for (var k = 0; k < newSegments.length; k++) {
                // If fatherSegmentIndex<0, it is not a child segment, either has a link to itself, or no link
                if (newSegments[k].parentSegID < 0) {

                    //preIndex = preSegments.indexOf(newSegments[k]);
                    if (preSegments.length != 0) {
                        _.each(preSegments, function(eachSegment, index) {
                            if (eachSegment.segID === newSegments[k].segID) {
                                // console.log("found");
                                // preIndex = index;
                                link[j].push([eachSegment, newSegments[k]]);
                            }
                        });
                    }

                } else {
                    // fatherSegmentIndex>0 it's a child segment, need to calculate the offset and position
                    if (preSegments.length != 0) {
                        _.each(preSegments, function(eachSegment, index) {
                            if (eachSegment.segID === newSegments[k].segID) {
                                link[j].push([eachSegment, newSegments[k]]);

                            } else if (eachSegment.segID === newSegments[k].parentSegID) {
                                preIndex = index;
                            }
                        });
                    }
                    //If preindex != -1 means, the father is in previous revision, so link the fathter segment and child segment
                    if (preIndex != -1) {
                        link[j].push([preSegments[preIndex], newSegments[k]]);
                        preIndex = -1;
                    } else {

                    }
                }
            } // End of Segments  for-loop
            // If there's no link at all, put a empty link for visualize reason
            if (link[j].length == 0) {
                link[j].push([-1, -1]);
            }
        } // End of revision for-loop to compute the links


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
                        var x0 = x(data[linkRevisionIndex].revTime);
                        var tempSegments1 = data[linkRevisionIndex].revSegments;
                        var tempSegments2 = data[linkRevisionIndex + 1].revSegments;

                        var index1 = tempSegments1.indexOf(d[0]);
                        var index2 = tempSegments2.indexOf(d[1]);

                        var accumulateSegLength1 = 0,
                            accumulateSegLength2 = 0;

                        for (var q = 0; q < index1; q++) {
                            accumulateSegLength1 += tempSegments1[q].segLength;
                        }
                        for (var q = 0; q < index2; q++) {
                            accumulateSegLength2 += tempSegments2[q].segLength;
                        }

                        if (d[1].segID === d[0].segID) {
                            var y0 = y(accumulateSegLength1);
                        } else {
                            var y0 = y(accumulateSegLength1 + d[1].offset);
                        }
                        var y1 = y(accumulateSegLength2);

                        var x1 = x(data[linkRevisionIndex + 1].revTime);

                        if (d[1].segID === d[0].segID) {
                            var dy = y(Math.min(d[0].segLength, d[1].segLength));
                        } 
                        else {
                            var dy = y(Math.min( (d[0].segLength - d[1].offset), d[1].segLength));
                        }   

                        return "M " + x0 + "," + y0 + " " + x0 + "," + (y0 + dy) + " " + x1 + "," + (y1 + dy) + " " + x1 + "," + y1 + "Z";
                    }
                })
            .attr("rev", function(d, i) {
                if (i == 0) {
                    linkRevisionIndex2++;
                }
                return linkRevisionIndex2;
            })
            .attr("fill", function(d, i) {
                if (d[1] != -1)
                    return d[1].authorColor;
            })
            .attr("opacity", 0.75)
            .attr("transform", "translate(25,0)");

            // setup tooltipster
            $('.tooltip').tooltipster({
               delay: 0,
               trigger: 'hover',
               iconDesktop: true,
               contentAsHTML: true,
               touchDevices: false
            });
    },

})


// When Google Doc is finished loading, initialize authorViz app
docuviz.init();


// These methods are provided by Chrome API
// chrome.runtime.onMessage method listen to the Model. Whenever Model wants to send data over to View, this method will activate and listen the call
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        switch (request.msg) {
            case 'progress':
                window.docuviz.renderProgressBar(request.soFar, request.outOf);
                sendResponse('done');
                break;

            case 'render':
                docuviz.renderResultPanel(request.html);
                sendResponse('end');
                break;

            case 'renderDocuviz': // this is when the Docuviz button is pressed
                window.docuviz.renderResultPanelForDocuviz(request.chars, request.revData); 
                sendResponse('end');
                break;

            default:
        }
    });