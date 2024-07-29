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
d3.csv(globalDataUrl).then(data => {
    // Take the last row (most recent year's data)
    const mostRecentData = data[data.length - 1];
    
    // Pie chart array
    const emissionsData = [
        {Sector: "Gas Fuel", Total: +mostRecentData["Gas Fuel"]},
        {Sector: "Liquid Fuel", Total: +mostRecentData["Liquid Fuel"]},
        {Sector: "Solid Fuel", Total: +mostRecentData["Solid Fuel"]},
        {Sector: "Cement", Total: +mostRecentData["Cement"]},
        {Sector: "Gas Flaring", Total: +mostRecentData["Gas Flaring"]}
    ];

    renderPieChart(emissionsData);
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
            const [xPos] = d3.pointer(event, this);  // Relative to the overlay
            const x0 = x.invert(xPos + margin.left); // Converts pixel to date
            const year = Math.round(x0.getFullYear());
            
            tooltip.html(`<strong>Year: ${closestPoint ? closestPoint.Year : "N/A"}</strong><br>Total: ${closestPoint ? d3.format(",")(closestPoint.Total) : "No data"}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);
        });
}

// Scene 2: Line Chart of CO2 Emissions for Top 10 Countries
function renderTopCountriesLineChart(data) {
    const svg = d3.select("#chart2");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = { top: 20, right: 150, bottom: 40, left: 50 };

    // Aggregate data to get the total emissions per country, excluding 'World'
    const countryTotals = d3.rollup(data, v => d3.sum(v, d => +d.Total), d => d.Country);
    const topCountries = Array.from(countryTotals)
        .filter(([country]) => country !== "World")
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country]) => country);

    // Filter data to include only the top 10 countries
    const filteredData = data.filter(d => topCountries.includes(d.Country));

    const x = d3.scaleTime()
        .domain(d3.extent(filteredData, d => new Date(d.Year, 0, 1)))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.Total)]).nice()
        .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
        .domain(topCountries)
        .range(d3.schemeCategory10);

    const line = d3.line()
        .defined(d => !isNaN(d.Total))
        .x(d => x(new Date(d.Year, 0, 1)))
        .y(d => y(d.Total));

    const countryData = d3.groups(filteredData, d => d.Country);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(d3.format(".2s")));

    svg.selectAll(".line")
        .data(countryData)
        .enter().append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", d => color(d[0]))
        .attr("stroke-width", 1.5)
        .attr("d", d => line(d[1]));

    // Append the names on the right side, spacing them dynamically
    countryData.forEach((d, i) => {
        svg.append("text")
            .attr("transform", `translate(${width - margin.right + 10},${y(d[1][d[1].length - 1].Total)})`)
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .style("font-size", "12px")
            .style("fill", color(d[0]))
            .text(d[0]);
    });

    // Tooltip and interactive lines setup
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("pointer-events", "none");

    svg.append('rect')
        .attr('class', 'overlay')
        .attr('width', width - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom)
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mousemove', function(event) {
            const [xPos] = d3.pointer(event, this);  // Relative to the overlay
            const x0 = x.invert(xPos + margin.left); // Converts pixel to date
            const year = Math.round(x0.getFullYear());

            const closestPoints = countryData.map(([country, values]) => {
                const closest = values.find(d => d.Year === year);
                return { 
                    country, 
                    total: closest ? closest.Total : null, // Keep as number for sorting
                    formattedTotal: closest ? d3.format(",")(closest.Total) : "No data", // Formatted for display
                    color: color(country)
                };
            }).filter(d => d.total !== null) // Filter out "No data" for sorting
              .sort((a, b) => b.total - a.total); // Sorting by total emissions numerically

            tooltip.html(`<strong>Year: ${year}</strong><br>` + closestPoints.map(d => 
                `<span style='color:${d.color};'>&#9679;</span> ${d.country}: ${d.formattedTotal}`
            ).join("<br>"))
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("opacity", 0.9);
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(200)
                style("opacity", 0);
        });
}

// Scene 3: Pie Chart of CO2 Emissions by Sector for a Selected Year
const sectorDescriptions = {
    "Gas Fuel": "Emissions from the combustion of gas fuels such as natural gas and butane.",
    "Liquid Fuel": "Emissions from the combustion of liquid fuels like gasoline and diesel.",
    "Solid Fuel": "Emissions from the combustion of solid fuels like coal and wood.",
    "Cement": "CO2 emissions from the production of cement, involving the calcination of limestone.",
    "Gas Flaring": "Emissions from the burning of gas released during oil extraction processes."
};

function renderPieChart(data) {
    const svg = d3.select("#chart3")
        .attr("width", 400)
        .attr("height", 400);
    const width = svg.attr("width");
    const height = svg.attr("height");
    const radius = Math.min(width, height) / 2;
    const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

    const totalEmissions = d3.sum(data, d => d.Total); // Total emissions for percentage calculation

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.Sector))
        .range(d3.schemeCategory10);

    const pie = d3.pie()
        .value(d => d.Total)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    const arcLabel = d3.arc()
        .innerRadius(radius * 0.8)
        .outerRadius(radius * 0.8);

    const outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 1.5); // For labels outside the pie

    const path = g.selectAll("path")
        .data(pie(data))
        .enter().append("path")
        .attr("fill", d => color(d.data.Sector))
        .attr("d", arc);

    const labels = g.selectAll("text")
        .data(pie(data))
        .enter().append("text")
        .each(function(d) {
            const centroid = arcLabel.centroid(d);
            const outerCentroid = outerArc.centroid(d);
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            const x = midAngle < Math.PI ? outerCentroid[0] : outerCentroid[0];
            const percentage = (d.data.Total / totalEmissions * 100);

            d3.select(this)
                .attr("transform", `translate(${centroid[0]}, ${centroid[1]})`)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .text(`${d.data.Sector}: ${percentage.toFixed(1)}%`);

            if (percentage < 5) {
                d3.select(this)
                    .attr("transform", `translate(${x}, ${outerCentroid[1]})`)
                    .attr("text-anchor", midAngle < Math.PI ? "start" : "end");
            }
        });

    path.on("click", function(event, d) {
        document.getElementById('pie-info').innerHTML = `Sector: ${d.data.Sector}, Total Emissions: ${d3.format(",")(d.data.Total)}`;
    });

    path.on("mouseover", function(event, d) {
        d3.select(this).transition()
            .duration(200)
            .attr("d", arc.outerRadius(radius + 10));
    })
    .on("mouseout", function(event, d) {
        d3.select(this).transition()
            .duration(200)
            .attr("d", arc.outerRadius(radius));
    });
}