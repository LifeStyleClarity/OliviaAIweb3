import { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";
import { Card, Skeleton } from "@heroui/react";

const BubbleMap = ({ data, bubbleIsLoading }) => {
  const svgRef = useRef();
  const gRef = useRef();

  useEffect(() => {
    const updateChart = () => {
      const parentWidth = svgRef.current.parentElement.offsetWidth || 800;
      const width = parentWidth;
      const height = 250;

      // Aggregate cashtags and mentions from input data
      const cashtagCounts = data.reduce((acc, item) => {
        const { name, value } = item;
        if (acc[name]) {
          acc[name] += value;
        } else {
          acc[name] = value;
        }
        return acc;
      }, {});

      const bubbleData = Object.entries(cashtagCounts).map(([cashtag, mentions]) => ({
        name: cashtag,
        value: mentions,
      }));

      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height);

      svg.selectAll("*").remove(); // Clear previous elements

      const g = svg.append("g").attr("ref", gRef);

      if (bubbleData.length === 0) {
        g.append("text")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .attr("font-size", "16px")
          .attr("fill", "#fff")
          .text("No data available");
        return;
      }

      // Scale for bubble radii
      const maxRadius = 40;
      const minRadius = 20;
      const valueExtent = d3.extent(bubbleData, (d) => d.value);
      const radiusScale = d3
        .scaleSqrt()
        .domain(valueExtent)
        .range([minRadius, maxRadius]);

      // Force simulation for positioning
      const simulation = d3
        .forceSimulation(bubbleData)
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05))
        .force("collision", d3.forceCollide((d) => radiusScale(d.value) + 5))
        .on("tick", ticked);

      const drag = d3
        .drag()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });

      // Create bubble groups
      const bubbles = g
        .selectAll("g")
        .data(bubbleData)
        .enter()
        .append("g")
        .call(drag);

      // Append circles with branded colors
      bubbles
        .append("circle")
        .attr("r", (d) => radiusScale(d.value))
        .attr("fill", "#4ED342") // Updated to brand green
        .attr("fill-opacity", 0.1)
        .attr("stroke", "#4ED342") // Updated to brand green
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseover", function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("fill-opacity", 0.2)
            .attr("stroke-opacity", 1.0);
        })
        .on("mouseout", function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("fill-opacity", 0.1)
            .attr("stroke-opacity", 0.5);
        })
        .on("click", () => {
          // Click handler can be implemented later if needed
        });

      // Append text to bubbles
      bubbles
        .append("text")
        .text((d) => `$${d.name}`)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("font-size", (d) => Math.min(radiusScale(d.value) / 3, 16))
        .attr("fill", "white")
        .attr("pointer-events", "none");

      // Add zoom behavior
      svg.call(
        d3.zoom().on("zoom", (event) => g.attr("transform", event.transform))
      );

      function ticked() {
        bubbles.attr("transform", (d) => `translate(${d.x},${d.y})`);
      }
    };

    updateChart();

    window.addEventListener("resize", updateChart);
    return () => window.removeEventListener("resize", updateChart);
  }, [data]);

  return (
    <>
      {bubbleIsLoading ? (
        <Card className="w-full h-[200px] space-y-5 p-4 bg-[#3139464f]" radius="lg">
          <Skeleton className="rounded-lg bg-[#3139464f]">
            <svg ref={svgRef}></svg>
            <div className="max-h-[200px] w-full rounded-lg bg-[#3139464f]"></div>
          </Skeleton>
        </Card>
      ) : (
        <div
          className="p-0 m-0 w-full"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <svg ref={svgRef}></svg>
        </div>
      )}
    </>
  );
};

BubbleMap.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  bubbleIsLoading: PropTypes.bool
};

export default BubbleMap;
