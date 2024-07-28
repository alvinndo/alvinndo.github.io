d3.csv('time_series_covid19_confirmed_US.csv').then(data => {
    // Process data for each scene

    // Scene 1: Total Confirmed Cases Over Time
    const svg1 = d3.select('#scene1').append('svg')
        .attr('width', 800)
        .attr('height', 400);

    const margin = {top: 20, right: 30, bottom: 30, left: 40},
        width = svg1.attr('width') - margin.left - margin.right,
        height = svg1.attr('height') - margin.top - margin.bottom;

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => new Date(d.Date)))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => +d.Confirmed)]).nice()
        .range([height - margin.bottom, margin.top]);

    const line = d3.line()
        .x(d => x(new Date(d.Date)))
        .y(d => y(+d.Confirmed));

    svg1.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    svg1.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svg1.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // Scene 2: State-wise Breakdown
    const svg2 = d3.select('#scene2').append('svg')
        .attr('width', 800)
        .attr('height', 400);

    const x2 = d3.scaleBand()
        .domain(data.map(d => d.State))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const y2 = d3.scaleLinear()
        .domain([0, d3.max(data, d => +d.Confirmed)]).nice()
        .range([height - margin.bottom, margin.top]);

    svg2.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x2).tickSizeOuter(0))
        .selectAll("text")
        .attr("transform", "rotate(-90)")
        .attr("dy", "-0.25em")
        .attr("dx", "-1em")
        .style("text-anchor", "end");

    svg2.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y2));

    svg2.selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x2(d.State))
        .attr("y", d => y2(+d.Confirmed))
        .attr("height", d => y2(0) - y2(+d.Confirmed))
        .attr("width", x2.bandwidth());

    // Scene 3: County-wise Exploration
    const svg3 = d3.select('#scene3').append('svg')
        .attr('width', 800)
        .attr('height', 400);

    // Define scales for the scatter plot
    const x3 = d3.scaleLinear()
        .domain(d3.extent(data, d => +d.Lat)).nice()
        .range([margin.left, width - margin.right]);

    const y3 = d3.scaleLinear()
        .domain(d3.extent(data, d => +d.Long_)).nice()
        .range([height - margin.bottom, margin.top]);

    svg3.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x3).ticks(width / 80).tickSizeOuter(0));

    svg3.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y3));

    // Create tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Scatter plot
    svg3.selectAll(".dot")
        .data(data)
        .join("circle")
        .attr("class", "dot")
        .attr("cx", d => x3(+d.Lat))
        .attr("cy", d => y3(+d.Long_))
        .attr("r", 3)
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`County: ${d.Admin2}<br>State: ${d.Province_State}<br>Confirmed: ${d[latest_date]}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", (event, d) => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
});