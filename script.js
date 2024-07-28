d3.csv('https://media.githubusercontent.com/media/alvinndo/alvinndo.github.io/main/processed_US_COVID_data.csv').then(data => {
    // Log data to check if it's loaded correctly
    console.log(data);

    // Convert date string to Date object and convert confirmed cases to numbers
    data.forEach(d => {
        d.Date = new Date(d.Date); // Convert Date to Date object
        d.Confirmed = +d.Confirmed; // Convert Confirmed cases to a number
    });

    // Set dimensions and margins for the charts
    const margin = {top: 20, right: 30, bottom: 30, left: 40};
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Scene 1: Total Confirmed Cases Over Time
    const svg1 = d3.select('#scene1').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set scales
    const x1 = d3.scaleTime()
        .domain(d3.extent(data, d => d.Date))
        .range([0, width]);

    const y1 = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Confirmed)]).nice()
        .range([height, 0]);

    // Add axes
    svg1.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x1));

    svg1.append("g")
        .call(d3.axisLeft(y1));

    // Draw the line
    const line = d3.line()
        .x(d => x1(d.Date))
        .y(d => y1(d.Confirmed));

    svg1.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // Scene 2: State-wise Breakdown
    const svg2 = d3.select('#scene2').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x2 = d3.scaleBand()
        .domain(data.map(d => d.Province_State))
        .range([0, width])
        .padding(0.1);

    const y2 = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Confirmed)]).nice()
        .range([height, 0]);

    svg2.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x2).tickSizeOuter(0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .attr("dy", "0.25em")
        .attr("dx", "-1em")
        .style("text-anchor", "end");

    svg2.append("g")
        .call(d3.axisLeft(y2));

    svg2.selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x2(d.Province_State))
        .attr("y", d => y2(d.Confirmed))
        .attr("height", d => y2(0) - y2(d.Confirmed))
        .attr("width", x2.bandwidth());

    // Scene 3: County-wise Exploration
    const svg3 = d3.select('#scene3').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Assuming Lat and Long are needed here; check your data for these fields
    const x3 = d3.scaleLinear()
        .domain(d3.extent(data, d => +d.Lat)).nice()
        .range([0, width]);

    const y3 = d3.scaleLinear()
        .domain(d3.extent(data, d => +d.Long_)).nice()
        .range([height, 0]);

    svg3.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x3).tickSizeOuter(0));

    svg3.append("g")
        .call(d3.axisLeft(y3));

    // Create scatter plot
    svg3.selectAll(".dot")
        .data(data)
        .join("circle")
        .attr("class", "dot")
        .attr("cx", d => x3(+d.Lat))
        .attr("cy", d => y3(+d.Long_))
        .attr("r", 3)
        .attr("fill", "steelblue");

    // Optionally add tooltips
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    svg3.selectAll(".dot")
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`County: ${d.Admin2}<br>State: ${d.Province_State}<br>Confirmed: ${d.Confirmed}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", (event, d) => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

}).catch(error => {
    console.error('Error loading the CSV file:', error);
});