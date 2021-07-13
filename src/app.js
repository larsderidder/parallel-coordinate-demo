/* global d3 */

const root = d3.select("svg");
const width = +root.attr("width");
const height = +root.attr("height");

const layout = {
  margin: {
    top: 70,
    right: 50,
    bottom: 30,
    left: 50
  }
};
layout.innerWidth = width - layout.margin.left - layout.margin.right;
layout.innerHeight = height - layout.margin.top - layout.margin.bottom;

const state = {
  axes: [],
  rows: [],
  axisScale: null,
  axisPositions: {},
  draggingAxis: "",
  brushes: {},
  activeBrushAxis: "",
  initialized: false
};

const initAxisScale = () => {
  state.axisScale = d3.scalePoint().range([0, layout.innerWidth]);
  state.axisScale.domain(state.axes);
  syncAxisPositions();
  state.initialized = true;
};

const syncAxisPositions = () => {
  state.axisPositions = {};
  state.axes.forEach((axisName) => {
    state.axisPositions[axisName] = state.axisScale(axisName);
  });
};

const matchesBrushes = (row, yScales) => {
  if (state.draggingAxis !== "") {
    return false;
  }
  const activeKeys = Object.keys(state.brushes);
  if (activeKeys.length === 0) {
    return true;
  }
  return activeKeys.every((key) => {
    const region = state.brushes[key];
    const yValue = yScales[key](row[key]);
    return yValue >= region[0] && yValue <= region[1];
  });
};

const handleBrushEnd = ({ selection }) => {
  if (selection == null) {
    delete state.brushes[state.activeBrushAxis];
  } else {
    state.brushes[state.activeBrushAxis] = selection;
  }
  renderChart();
};

const handleDragStart = (axisName) => {
  state.draggingAxis = axisName;
  d3.selectAll(`.y-axis-${axisName}`)
    .raise();
  d3.selectAll(`.y-axis-${axisName} text`)
    .attr("fill", "red");
  d3.selectAll(`.y-axis-${axisName} line`)
    .attr("stroke", "red");
  d3.selectAll(".line-chart").attr("stroke-opacity", 0);
};

const handleDragMove = (event) => {
  state.axisPositions[state.draggingAxis] = state.axisPositions[state.draggingAxis] + event.x;
  renderChart();
};

const handleDragEnd = (axisName, event) => {
  state.axisPositions[state.draggingAxis] = state.axisPositions[state.draggingAxis] + event.x;
  state.axes = Object.keys(state.axisPositions).sort((left, right) => {
    return state.axisPositions[left] - state.axisPositions[right];
  });
  state.axisScale.domain(state.axes);
  syncAxisPositions();
  state.draggingAxis = "";
  renderChart();
  d3.selectAll(`.y-axis-${axisName} text`)
    .attr("fill", "#000");
  d3.selectAll(`.y-axis-${axisName} line`)
    .attr("stroke", "#000");
};

const renderChart = () => {
  const container = root.selectAll(".container").data([null]);
  const containerEnter = container.enter().append("g").attr("class", "container");
  const chart = containerEnter.merge(container)
    .attr("transform", `translate(${layout.margin.left}, ${layout.margin.top})`);

  if (!state.initialized) {
    initAxisScale();
  }

  const yScales = {};
  state.axes.forEach((axisName) => {
    const scale = d3.scaleLinear()
      .domain(d3.extent(state.rows, (row) => row[axisName]))
      .range([layout.innerHeight, 0]);
    yScales[axisName] = scale;

    const axis = d3.axisLeft(scale);
    const axisGroup = chart.selectAll(".y-axis-" + axisName).data([null]);
    const axisGroupEnter = axisGroup.enter().append("g").attr("class", "y-axis-" + axisName);
    const axisGroupMerge = axisGroupEnter.merge(axisGroup);

    axisGroupMerge
      .attr("transform", () => `translate(${state.axisPositions[axisName]}, ${0})`)
      .call(axis);

    const axisLabel = axisGroupEnter
      .append("text")
      .attr("y", -20)
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(0)")
      .attr("fill", "black")
      .merge(axisGroup.select(".axis-label"))
      .attr("x", 0)
      .text(axisName);

    const brushY = d3.brushY()
      .extent([
        [-15, 0],
        [15, layout.innerHeight]
      ])
      .on("start", function () {
        state.activeBrushAxis = axisName;
        if (!state.brushes[state.activeBrushAxis]) {
          state.brushes[state.activeBrushAxis] = [];
        }
      })
      .on("brush end", handleBrushEnd);

    axisGroupMerge.call(brushY);

    const dragY = d3.drag()
      .on("start", function () {
        handleDragStart(axisName);
      })
      .on("drag", function (event) {
        handleDragMove(event);
      })
      .on("end", function (event) {
        handleDragEnd(axisName, event);
      });

    axisLabel.call(dragY);
  });

  const lineMaker = (row) => d3.line()(
    state.axes.map((axisName) => {
      return [state.axisPositions[axisName], yScales[axisName](row[axisName])];
    })
  );

  const ghostLines = chart.selectAll(".line-chart2").data(state.rows);
  ghostLines
    .enter().append("path")
    .attr("class", "line-chart2")
    .style("fill", "none");
  ghostLines.exit().remove();

  const activeLines = chart.selectAll(".line-chart").data(state.rows);
  activeLines
    .enter().append("path")
    .attr("class", "line-chart")
    .style("fill", "none")
    .attr("stroke-opacity", 0);
  activeLines.exit().remove();

  chart.selectAll(".line-chart2")
    .attr("d", (row) => lineMaker(row))
    .attr("stroke", "#eee");

  chart.selectAll(".line-chart")
    .attr("stroke-opacity", (row) => matchesBrushes(row, yScales) ? 1 : 0)
    .transition().duration(1000)
    .attr("d", (row) => lineMaker(row))
    .attr("stroke", "#46b76f");
};

d3.json("data.json").then((payload) => {
  state.axes = payload.allowed_axes;
  state.rows = payload.data;
  renderChart();
});
