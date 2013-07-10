/*global $, d3, _ */

$(function(){
    var rectWidth = 300;
    var rectHeight = 100;
    var rectPositionData = [{x:400, y:500},{x:800, y:500}];
    var linksData = [];
    
    var svg = d3.select('body').append('svg').attr('width', "100%").attr('height', '100%');

    var newNodeBtn = svg.append("g")
            .attr("transform", "translate(50,50)")
            .style("cursor","pointer")
            .on("click",insertNewNode);

    var draggingNewLink = false;

    newNodeBtn.append("circle")
        .attr("r", 40)
        .style("fill", "#ccc");

    newNodeBtn.append("text")
        .attr("dy", ".3em")
        .style("text-anchor","middle")
        .style("font-size", "50px")
        .text("+");
    


    var diagonal = d3.svg.diagonal().projection(function(d) { return [d.x + rectWidth / 2,
                                                                      d.y + rectHeight / 2]; });

    //var newDiagonal = d3.svg.diagonal().projection(function(d) { return [d.x, d.y]; });

    var updateLinks = function(){
        var links = svg.selectAll(".link").data(linksData, function(d){
            return d.source.x + "," + d.source.y + "," + d.target.x + "," + d.target.y;
        });

        links.enter().insert("path","g.node")
            .attr("class", "link")
            .attr("d", diagonal);

        links.exit().remove();
    };

    updateLinks();

    var nodeColor = function(d){
        var xCol = (d.x + this.width.baseVal.value / 2) * 255 / parseInt(svg.style("width"));
        var yCol = (d.y + this.height.baseVal.value / 2) * 255 / parseInt(svg.style("height"));

        return "rgb("+ Math.round(xCol) + ","+
            Math.round(255 - Math.sqrt(xCol * yCol)) +
            "," + Math.round(yCol) +")";
    };


    var appendNewLinkButton = function(container){
        container.append("circle")
            .attr("r", 15)
            .style("fill", "#000");
        
        container.append("text")
            .attr("dy", ".3em")
            .style("text-anchor", "middle")
            .style("font-size", "20px")
            .style("fill", "#fff")
            .text("+");
    };

    var insertNodes = function(){
        var gData = svg.selectAll("g.node")
                .data(rectPositionData);



        var g = gData.enter().append("g").attr("class", "node")
                .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")"; })
                .call(d3.behavior.drag()
                      .origin(function(d) { return d; })
                      .on('drag',dragmove));
        

        g.append("rect")
            .attr("width", rectWidth + "px")
            .attr("height", rectHeight + "px")
            .style("fill", nodeColor)
            .style("stroke-width", "4");
        

        var newLinkButton = g.append("g")
                .attr("class", "new-link-button")
                .attr("transform", "translate("+ (rectWidth - 30) + "," + (rectHeight - 30) +")")
                .style("cursor", "pointer")
                .call(d3.behavior.drag()
                      .origin(function(d){ return d; })
                      .on('dragstart', newLinkDragStart)
                      .on('drag', newLinkDrag)
                      .on('dragend', newLinkDragEnd));

        appendNewLinkButton(newLinkButton);

        g.append("text")
            .attr("dy", ".3em")
            .attr("class", "node-desc")
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .style("fill", "#000")
            .attr("transform", "translate("+rectWidth / 2 + "," + rectHeight/2 + ")")
            .text("Click to edit");

        g.append("text")
            .attr("dy", ".3em")
            .attr("class", "remove-node")
            .style("text-anchor", "middle")
            .style("font-size", "25px")
            .style("fill", "#000")
            .style("cursor", "pointer")
            .attr("transform", "translate("+ 20 + "," + 20 + ")")
            .text("×")
            .on("click",function(d){
                var i = _.indexOf(rectPositionData, d);
                var el = rectPositionData.splice(i,1)[0];


                svg.selectAll("g.node")
                    .data(rectPositionData,function(d){ return d.x + "," + d.y; })
                    .exit()
                    .remove();

                linksData = _.filter(linksData, function(link){
                    return link.source !== el && link.target !== el;
                });

                updateLinks();
            });

    };

    insertNodes();


    //editing node text:
    $("svg").on("click", ".node-desc", function(e){
        var $text = $(this);
        var $input = $('<input type="text">').css({
            position: "absolute",
            left: $text.position().left + $text.width()/2 - 75,
            top: $text.position().top,
            width: "150px",
            height: "20px"
        });

        $text.hide();
        
        var updateText = function(){
            $text.text($input.val());
            $input.remove();
            $text.show();
        };
        
        $("body").append($input);

        $input.val($text.text()).focus().blur(updateText).keyup(function(e){
            if(e.which == 13) updateText();
        });
    });

    var getNewLinkLinkPos = function(mousePos){
        return {
            x: mousePos.x + rectWidth/2  -30,
            y: mousePos.y + rectHeight/2  -30
        };
    };

    var getNewLinkBtnPos = function(mousePos){
        return {
            x: mousePos.x + rectWidth  -30,
            y: mousePos.y + rectHeight  -30
        };
    };
    
    function dragmove(d){
        d3.select(this).attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")")        
            .select("rect")
            .style("fill", nodeColor);
        
        d.x = d3.event.x;
        d.y = d3.event.y;

        svg.selectAll(".link").attr("d", diagonal);
    };

    function newLinkDragStart(d){
        d3.event.sourceEvent.stopPropagation();

        svg.insert("path", "g.node").data([{
            source: d,
            target: d
        }]).attr("class", "link new")
            .attr("d", diagonal);

        var newLinkDragButton = svg.append("g").attr("class", "new-link-drag-button")
                .data([getNewLinkBtnPos(d)])
                .attr("transform", function(d){return "translate("+ d.x + "," + d.y + ")";});
        
        appendNewLinkButton(newLinkDragButton);

        d3.select(this).attr("display", "none");

    }

    var targetNode;

    function newLinkDrag(d){
        var newLinkBtnPos = getNewLinkBtnPos(d3.event);
        var newLinkLinkPos = getNewLinkLinkPos(d3.event);
        
        svg.selectAll(".link.new").data([{
            source: d,
            target: newLinkLinkPos
        }]).attr("d", diagonal);

        svg.selectAll(".new-link-drag-button").data([newLinkBtnPos])
            .attr("transform", function(d){return "translate("+ d.x + "," + d.y + ")";});

        var nodes = svg.selectAll("g.node");

        targetNode = _.find(nodes[0], function(node){
            var d = d3.select(node).datum();
            
            return (d.x <= newLinkBtnPos.x && d.x + rectWidth >= newLinkBtnPos.x &&
                    d.y <= newLinkBtnPos.y && d.y + rectHeight >= newLinkBtnPos.y);
        });

        nodes.select("rect").style("stroke", null);
        targetNode && d3.select(targetNode).select("rect").style("stroke", "#000");
    }

    function newLinkDragEnd(d){
        svg.selectAll(".link.new, .new-link-drag-button").remove();
        
        d3.select(this).attr("display", null);
        
        svg.selectAll("g.node rect").style("stroke", null);

        if(targetNode){
            var targetD = d3.select(targetNode).datum();

            linksData.push({
                source: d,
                target: targetD
            });

            updateLinks();
        }  
    }

    function insertNewNode(){
        var x = 100;
        var y = 100;

        rectPositionData.push({
            x: Math.round(Math.random() * parseInt(svg.style("width"),10) - rectWidth),
            y: Math.round(Math.random() * parseInt(svg.style("height"),10) - rectHeight)
        });

        insertNodes();
    }
});
