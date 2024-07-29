let currentScene = 0;
const scenes = ["scene-1", "scene-2", "scene-3"];
const globalDataUrl = "https://raw.githubusercontent.com/datasets/co2-fossil-global/master/global.csv";
const countryDataUrl = "annual-co2-emissions-per-country.csv";

// Function to show a specific scene
function showScene(index) {
    scenes.forEach((scene, i) => {
        document.getElementById(scene).classList.toggle('visible', i === index);
    });
}

// Functions to navigate through scenes
function nextScene() {
    currentScene = (currentScene + 1) % scenes.length;
    showScene(currentScene);
}

function previousScene() {
    currentScene = (currentScene - 1 + scenes.length) % scenes.length;
    showScene(currentScene);
}


// Fetch the country data and render the chart for scenes 1 and 2
d3.csv(countryDataUrl).then(countryData => {
    countryData = countryData.filter(d => d.Code);  // Filter out rows without a Code
    countryData.forEach(d => {
        d.Year = +d.Year;
        d.Total = +d["Annual CO2 emissions"];
    });
    const worldData = countryData.filter(d => d.Country === "World");
    renderGlobalCO2EmissionsChart(worldData);
    renderTopCountriesLineChart(countryData.filter(d => d.Country !== "World"));
});

// Fetch the global data and render the charts for scene 3
d3.csv(globalDataUrl).then(globalData => {
    globalData.forEach(d => {
        d.Year = +d.Year;
        d.Total = +d.Total;
        d["Gas Fuel"] = +d["Gas Fuel"];
        d["Liquid Fuel"] = +d["Liquid Fuel"];
        d["Solid Fuel"] = +d["Solid Fuel"];
        d.Cement = +d.Cement;
        d["Gas Flaring"] = +d["Gas Flaring"];
        d["Per Capita"] = +d["Per Capita"];
    });
    renderPieChart(globalData);
});

// Scene 1: Global CO2 Emissions Over Time for "World"
function renderGlobalCO2EmissionsChart(data) {
    const svg = d3.select("#chart1");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = { top: 20, right: 100, bottom: 40, left: 50 };

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => new Date(d.Year, 0, 1)))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Total)]).nice()
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(d3.format(".2s")));

    const line = d3.line()
        .x(d => x(new Date(d.Year, 0, 1)))
        .y(d => y(d.Total));

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // Add tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("pointer-events", "none");

    // Overlay for capturing mouse events
    svg.append("rect")
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mousemove", function(event) {
            const [xPos] = d3.pointer(event);
            const year = x.invert(xPos).getFullYear();
            const closestPoint = data.find(d => d.Year === year);

            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            
            tooltip.html(`Year: ${closestPoint ? closestPoint.Year : "N/A"}<br>Total: ${closestPoint ? closestPoint.Total : "No data"}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

// Scene 2: Line Chart of CO2 Emissions for Top 10 Countries
function renderTopCountriesLineChart(data) {
    const svg = d3.select("#chart2");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = { top: 20, right: 150, bottom: 40, left: 50 };  // Increased right margin for labels

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => new Date(d.Year, 0, 1)))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Total)]).nice()
        .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.Country))
        .range(d3.schemeCategory10);

    const line = d3.line()
        .defined(d => !isNaN(d.Total))  // Ensure that the line is only drawn where data is defined
        .x(d => x(new Date(d.Year, 0, 1)))
        .y(d => y(d.Total));

    const countryData = d3.groups(data, d => d.Country);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(d3.format(".2s")));

    const countryPaths = svg.selectAll(".line")
        .data(countryData)
        .enter().append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", d => color(d[0]))
        .attr("stroke-width", 1.5)
        .attr("d", d => line(d[1]));

    // Country labels spaced out
    countryPaths.each(function(d) {
        const pathLength = this.getTotalLength();
        const lastPoint = this.getPointAtLength(pathLength - 1);
        svg.append("text")
            .attr("class", "country-label")
            .attr("transform", `translate(${width - margin.right + 10},${lastPoint.y})`)
            .attr("dy", "0.35em")
            .attr("text-anchor", "start")
            .style("font-size", "12px")
            .style("fill", color(d[0]))
            .text(d[0]);
    });

    // Tooltip setup
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("pointer-events", "none");

    svg.on("mousemove", function(event) {
        const [xPos] = d3.pointer(event, this);
        const year = x.invert(xPos).getFullYear();

        const closestPoints = countryData.map(([country, values]) => {
            const closest = values.find(d => d.Year === year);
            return { country, total: closest ? closest.Total : "No data", color: color(country) };
        }).filter(d => d.total !== "No data").sort((a, b) => b.total - a.total); // Sorting and filtering

        tooltip.transition()
            .duration(100)
            .style("opacity", .9);

        tooltip.html(closestPoints.map(d => 
            `<span style='color:${d.color};'>&#9679;</span> ${d.country}: ${d.total}`
        ).join("<br>"))
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    }).on("mouseout", function() {
        tooltip.transition()
            .duration(200)
            .style("opacity", 0);
    });
}

// Scene 3: Pie Chart of CO2 Emissions by Sector for a Selected Year
function renderPieChart(data) {
    const svg = d3.select("#chart3");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const radius = Math.min(width, height) / 2;
    const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

    // Select a specific year (latest year in the dataset)
    const latestYearData = data[data.length - 1];
    const sectors = ["Gas Fuel", "Liquid Fuel", "Solid Fuel", "Cement", "Gas Flaring"].map(key => ({
        sector: key,
        value: latestYearData[key]
    }));

    const color = d3.scaleOrdinal()
        .domain(sectors.map(d => d.sector))
        .range(d3.schemeCategory10);

    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    g.selectAll("path")
        .data(pie(sectors))
        .enter().append("path")
        .attr("fill", d => color(d.data.sector))
        .attr("d", arc);

    g.selectAll("text")
        .data(pie(sectors))
        .enter().append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dy", "0.35em")
        .text(d => d.data.sector);
}
