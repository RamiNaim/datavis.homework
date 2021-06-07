const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected = '';
let selectedCountry = '';

const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);
const colorMap = {'asia': '#DD4949', 'europe': '#39CDA1', 'africa': '#FD710C', 'americas': '#A14BE5'};

const regions = ['asia', 'europe', 'africa', 'americas'];
let regionData = {};
let barData = [];
let countryCount = {};

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d=>d.region)).values());

    d3.select('#range').on('change', function(){ 
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScatterPlot();
        updateBar();
    });

    d3.select('#radius').on('change', function(){ 
        rParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#x').on('change', function(){ 
        xParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#y').on('change', function(){ 
        yParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#param').on('change', function(){ 
        param = d3.select(this).property('value');
        updateBar();
    });

    d3.select('#p').on('change', function(){
        lineParam = d3.select(this).property('value');
        updateLinePlot(null);
    });

    updateBar();
    updateScatterPlot();

    function highlightRegion(id){
        if (highlighted != id){
            highlighted = id;
            d3.selectAll('rect').style("opacity", "0.3");
            d3.selectAll('circle').style("opacity", "0");

            d3.select("#" + id).style("opacity", "1");

            let selectedRegion = id.slice(0, -4);
            d3.selectAll("circle[region='" + selectedRegion + "']").style("opacity", "0.8");

        } else {
            highlighted = "";
            d3.selectAll('rect').style("opacity", "1");
            d3.selectAll('circle').style("opacity", "0.8");
        }
    }

    function updateBar(){
        barChart.selectAll("rect").remove()

        for (let r in regions){ countryCount[regions[r]] = 0; }
        for (let idx in data){ countryCount[data[idx].region] += 1; }
        for (let r in regions) { regionData[regions[r]] = 0; }
        for (let idx in data)
        {
            let p = parseFloat(data[idx][param][year]);
            if (isNaN(p)){
                countryCount[data[idx].region] -= 1;
            } else {
                regionData[data[idx].region] += p;
            }
        }

        barData = [];
        for (let r in regions) {
            regionData[regions[r]] = regionData[regions[r]] / countryCount[regions[r]];
            barData.push({
               'region': regions[r],
               'mean': regionData[regions[r]]
            });
        }

        xBar.domain(regions);
        yBar.domain([0, d3.max(barData, function(d) { return +d.mean; })]);

        xBarAxis.call(d3.axisBottom(xBar))
        yBarAxis.call(d3.axisLeft(yBar))

        barChart
            .selectAll(".bar")
            .data(barData)
            .enter()
            .append("rect")
            .attr("id", function (d) {return d.region + "_bar"; } )
            .attr("x", function (d) { return xBar(d.region); } )
            .attr("y", function (d) { return yBar(d.mean) - margin; } )
            .attr("width", xBar.bandwidth())
            .attr("height", function(d) { return height - yBar(d.mean); })
            .style("fill", function (d) { return colorMap[d.region]; })
            .style("opacity", "1")
            .on('click', function() { highlightRegion(this.id); } )

    }

    function updateScatterPlot(){
        selectedCountry = "";

        scatterPlot.selectAll('circle').remove();

        let xRange = [d3.min(data, function(d) { return +d[xParam][year]; }), d3.max(data, function(d) { return +d[xParam][year]; })];
        let yRange = [d3.min(data, function(d) { return +d[yParam][year]; }), d3.max(data, function(d) { return +d[yParam][year]; })];
        let rRange = [d3.min(data, function(d) { return +d[rParam][year]; }), d3.max(data, function(d) { return +d[rParam][year]; })];

        let rScaler = radiusScale.domain(rRange);

        x.domain(xRange);
        y.domain(yRange);

        xAxis.call(d3.axisBottom(x))
        yAxis.call(d3.axisLeft(y))

        scatterPlot
            .selectAll("circle")
            .data(data)
            .enter()
            .append('circle')
            .attr("cx", function (d) { return x(d[xParam][year]); } )
            .attr("cy", function (d) { return y(d[yParam][year]); } )
            .attr("r", function (d) { return rScaler(d[rParam][year]); })
            .attr("region", function (d) { return d.region; } )
            .attr("country", function (d) { return d.country; } )
            .style("fill", function (d) { return colorMap[d.region]; })
            .style("opacity", 0.8)
            .on('click', function () { updateLinePlot(this); })

    }

    function updateLinePlot(that){

        if (that != null){
            selected = that;
            selectedCountry = that.attributes.country.nodeValue;
        }

        if (selected == ""){
            d3.select('#line-selector').style('display', 'none');
            if (that == null){
                return;
            }
            selected = that;
            selectedCountry = that.attributes.country.nodeValue;
        }

        countryName.text("");
        lineChart.selectAll("path").remove();

        countryName.text(selectedCountry);

        d3.select('#line-selector').style('display', '');
        d3.selectAll('circle').style("stroke-width", 1);

        d3.select(selected)
            .raise()
            .style("stroke", '#000000')
            .style("stroke-width", 2);

        lineParam = d3.select('#p').property('value');
        let countryData = [];
        for (let idx in data){
            if (data[idx].country == selectedCountry){
                for (let y in data[idx][lineParam]) {
                    let val = parseFloat(data[idx][lineParam][y]);
                    // let date = d3.timeParse("%Y-%m-%d")(year + "-01-01")
                    let date = parseInt(y, 10)
                    if  (!isNaN(val) && !isNaN(date)){
                        countryData.push({
                            'year': date,
                            'value': val
                        })

                    }
                }
            }
        }

        let xRange = [d3.min(countryData, function(d) { return d.year; }), d3.max(countryData, function(d) { return d.year; })];
        let yRange = [0, d3.max(countryData, function(d) { return +d.value; })];

        x.domain(xRange)
        y.domain(yRange)

        xLineAxis.call(d3.axisBottom(x))
        yLineAxis.call(d3.axisLeft(y))

        lineChart
            .append("path")
            .datum(countryData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function(d) { return x(d.year) })
                .y(function(d) { return y(d.value) })
            )

    }

});


async function loadData() {
    const data = { 
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };
    
    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}