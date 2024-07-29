let currentScene = 0;
const scenes = ["scene-1", "scene-2", "scene-3"];
const globalDataUrl = "https://raw.githubusercontent.com/datasets/co2-fossil-global/master/global.csv";
const countryDataUrl = "/mnt/data/annual-co2-emissions-per-country.csv";

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

// Fetch the global data and render the charts for scenes 1 and 3
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
    renderLineChart(globalData);
    renderPieChart(globalData);
});

// Fetch the country data and render the chart for scene 2
d3.csv(countryDataUrl).then(countryData => {
    countryData.forEach(d => {
        d.Year = +d.Year;
        d.Total = +d["Annual CO2 emissions"];
    });
    renderTopCountriesLineChart(countryData);
});

// Scene 1: Line Chart of Global CO2 Emissions
function renderLineChart(data) {
    const svg = d3.select("#chart1");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = {top: 20, right: 30, bottom: 30, left: 40};

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => new Date(d.Year, 0, 1)))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Total)]).nice()
        .range([height - margin.bottom, margin.top]);

    const line = d3.line()
        .x(d => x(new Date(d.Year, 0, 1)))
        .y(d => y(d.Total));

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);
}

// Scene 2: Line Chart of CO2 Emissions for Top 7 Countries
function renderTopCountriesLineChart(data) {
    const svg = d3.select("#chart2");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = {top: 20, right: 30, bottom: 40, left: 40};

    // Aggregate data to get the total emissions per country
    const countryTotals = d3.rollup(data, v => d3.sum(v, d => d.Total), d => d.Country);

    // Get the top 7 countries by total emissions
    const topCountries = Array.from(countryTotals, ([Country, Total]) => ({Country, Total}))
        .sort((a, b) => d3.descending(a.Total, b.Total))
        .slice(0, 7)
        .map(d => d.Country);

    // Filter data to include only the top 7 countries
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
        .x(d => x(new Date(d.Year, 0, 1)))
        .y(d => y(d.Total));

    const countryData = d3.groups(filteredData, d => d.Country);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0)
            .tickFormat(d => {
                const year = d.getFullYear();
                return year % 50 === 0 || year >= 2000 && year % 10 === 0 ? year : "";
            }));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svg.selectAll(".line")
        .data(countryData)
        .enter().append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", d => color(d[0]))
        .attr("stroke-width", 1.5)
        .attr("d", d => line(d[1]));

    // Add tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    svg.selectAll(".line")
        .data(countryData)
        .enter().append("g")
        .attr("class", "hover-line")
        .selectAll("circle")
        .data(d => d[1])
        .enter().append("circle")
        .attr("cx", d => x(new Date(d.Year, 0, 1)))
        .attr("cy", d => y(d.Total))
        .attr("r", 3)
        .attr("fill", d => color(d.Country))
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`Country: ${d.Country}<br>Year: ${d.Year}<br>Total: ${d.Total}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", (d) => {
            tooltip.transition()
                .duration(500)
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
