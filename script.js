let currentScene = 0;
const scenes = ["scene-1", "scene-2", "scene-3"];
const dataUrl = "https://raw.githubusercontent.com/datasets/co2-fossil-global/master/global.csv";

function showScene(index) {
    scenes.forEach((scene, i) => {
        document.getElementById(scene).classList.toggle('visible', i === index);
    });
}

function nextScene() {
    currentScene = (currentScene + 1) % scenes.length;
    showScene(currentScene);
}

function previousScene() {
    currentScene = (currentScene - 1 + scenes.length) % scenes.length;
    showScene(currentScene);
}

d3.csv(dataUrl).then(data => {
    renderLineChart(data);
    renderBarChart(data);
    renderPieChart(data);
});

function renderLineChart(data) {
    const svg = d3.select("#chart1");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = {top: 20, right: 30, bottom: 30, left: 40};

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => new Date(d.Year)))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => +d.Total)]).nice()
        .range([height - margin.bottom, margin.top]);

    const line = d3.line()
        .x(d => x(new Date(d.Year)))
        .y(d => y(+d.Total));

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

function renderBarChart(data) {
    const svg = d3.select("#chart2");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = {top: 20, right: 30, bottom: 40, left: 40};

    const topCountries = data.slice().sort((a, b) => d3.descending(+a.Total, +b.Total)).slice(0, 10);

    const x = d3.scaleBand()
        .domain(topCountries.map(d => d.Country))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(topCountries, d => +d.Total)]).nice()
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSizeOuter(0));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svg.selectAll(".bar")
        .data(topCountries)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.Country))
        .attr("y", d => y(+d.Total))
        .attr("width", x.bandwidth())
        .attr("height", d => y(0) - y(+d.Total))
        .attr("fill", "steelblue");
}

function renderPieChart(data) {
    const svg = d3.select("#chart3");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const radius = Math.min(width, height) / 2;
    const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.Sector))
        .range(d3.schemeCategory10);

    const pie = d3.pie()
        .value(d => +d.Total)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    g.selectAll("path")
        .data(pie(data))
        .enter().append("path")
        .attr("fill", d => color(d.data.Sector))
        .attr("d", arc);

    g.selectAll("text")
        .data(pie(data))
        .enter().append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dy", "0.35em")
        .text(d => d.data.Sector);
}
