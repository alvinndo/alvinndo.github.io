let currentScene = 0;
const scenes = ["scene-1", "scene-2", "scene-3"];
const dataUrl = "https://raw.githubusercontent.com/datasets/co2-fossil-global/master/global.csv";

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

// Fetch the data and render the charts
d3.csv(dataUrl).then(data => {
    data.forEach(d => {
        d.Year = +d.Year;
        d.Total = +d.Total;
        d["Gas Fuel"] = +d["Gas Fuel"];
        d["Liquid Fuel"] = +d["Liquid Fuel"];
        d["Solid Fuel"] = +d["Solid Fuel"];
        d.Cement = +d.Cement;
        d["Gas Flaring"] = +d["Gas Flaring"];
        d["Per Capita"] = +d["Per Capita"];
    });
    renderLineChart(data);
    renderStackedBarChart(data);
    renderPieChart(data);
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

// Scene 2: Stacked Bar Chart of CO2 Emissions by Source
function renderStackedBarChart(data) {
    const svg = d3.select("#chart2");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = {top: 20, right: 30, bottom: 40, left: 40};

    const keys = ["Gas Fuel", "Liquid Fuel", "Solid Fuel", "Cement", "Gas Flaring"];

    const x = d3.scaleBand()
        .domain(data.map(d => d.Year))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Total)]).nice()
        .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(d3.schemeCategory10);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSizeOuter(0));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    const stack = d3.stack()
        .keys(keys)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const series = stack(data);

    svg.append("g")
        .selectAll("g")
        .data(series)
        .enter().append("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => x(d.data.Year))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());
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
