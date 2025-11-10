function simulate(data, svg) {
  console.log("network.js fixed v3 loaded");
  const width = parseInt(svg.attr("viewBox").split(" ")[2]);
  const height = parseInt(svg.attr("viewBox").split(" ")[3]);
  const main_group = svg.append("g").attr("transform", "translate(0, 50)");

  // calculate degree of each node
  const node_degree = {};
  data.links.forEach(l => {
    node_degree[l.source] = (node_degree[l.source] || 0) + 1;
    node_degree[l.target] = (node_degree[l.target] || 0) + 1;
  });

  const degrees = Object.values(node_degree);
  const scale_radius = d3.scaleLinear()
    .domain(d3.extent(degrees.length ? degrees : [0, 1]))
    .range([3, 12]);

  const color = d3.scaleSequential()
    .domain([1995, 2020])
    .interpolator(d3.interpolateViridis);

  const link_elements = main_group.append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`)
    .selectAll("line")
    .data(data.links)
    .enter()
    .append("line");

  const treatPublishersClass = (Publisher) => {
    let temp = (Publisher ?? "").toString()
      .replace(/[ .,\/]/g, "");
    return "gr" + temp;
  };

  const node_elements = main_group.append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`)
    .selectAll("g.node")
    .data(data.nodes)
    .enter()
    .append("g")
    .attr("class", d => treatPublishersClass(d.Publisher))
    .on("mouseover", function (event, d) {
      d3.select("#Paper_Title").text(d.Title || "");
      node_elements.classed("inactive", true);
      const selected_class = d3.select(this).attr("class").split(" ")[0];
      d3.selectAll("." + selected_class).classed("inactive", false);
    })
    .on("mouseout", function () {
      d3.select("#Paper_Title").text("");
      d3.selectAll(".inactive").classed("inactive", false);
    });

  node_elements.append("circle")
    .attr("r", d => scale_radius(node_degree[d.id] || 0))
    .attr("fill", d => color(+d.Year));

  const ForceSimulation = d3.forceSimulation(data.nodes)
    .force("collide",
      d3.forceCollide().radius(d => scale_radius(node_degree[d.id] || 0) * 1.2))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force("charge", d3.forceManyBody())
    .force("link", d3.forceLink(data.links).id(d => d.id))
    .on("tick", ticked);

  function ticked() {
    node_elements.attr("transform", d => `translate(${d.x},${d.y})`);
    link_elements
      .attr("x1", d => d.source.x)
      .attr("x2", d => d.target.x)
      .attr("y1", d => d.source.y)
      .attr("y2", d => d.target.y);
  }

  svg.call(
    d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([1, 8])
      .on("zoom", ({ transform }) => {
        main_group.attr("transform", transform);
      })
  );
}