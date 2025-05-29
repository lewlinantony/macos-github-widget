// --- USER SETTINGS ---
const githubUsername = "your-github-username"; // Replace with your GitHub username
const githubToken = "your-github-token"; // Replace with your GitHub personal access token

// Compact widget dimensions
const widgetWidth = 318; // Reduced from 420
const widgetLeft = 17;
const widgetTop = 200;

// Refresh every hour
export const refreshFrequency = 3600000;

// --- GraphQL Query ---
const query = `
{
  user(login: "${githubUsername}") {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}
`;

// --- Utility: Map contribution count to colors ---
const getColor = (count) => {
  if (count === 0) return "#1a1e23";
  else if (count >= 1 && count < 5) return "#0d4429";
  else if (count >= 5 && count < 10) return "#006d32";
  else if (count >= 10 && count < 20) return "#26a641";
  else if (count >= 20 && count < 30) return "#39d353";
  else return "#4ade80";
};

// --- Generate compact SVG grid ---
const generateSVG = (weeks) => {
  const cellSize = 10; // Reduced from 14
  const cellMargin = 2; // Reduced from 3
  const cornerRadius = 2;
  const availableGridWidth = widgetWidth - 20; // Less padding
  const weekWidth = cellSize + cellMargin;
  const weeksToShow = Math.floor(availableGridWidth / weekWidth);
  const displayWeeks = weeks.slice(-weeksToShow);
  const gridWidth = weeksToShow * weekWidth - cellMargin;
  const gridHeight = 7 * (cellSize + cellMargin) - cellMargin;
  let svgCells = "";

  displayWeeks.forEach((week, weekIndex) => {
    week.contributionDays.forEach((day, dayIndex) => {
      const x = weekIndex * weekWidth;
      const y = dayIndex * (cellSize + cellMargin);
      const fill = getColor(day.contributionCount);
      svgCells += `
        <rect 
          x="${x}" 
          y="${y}" 
          width="${cellSize}" 
          height="${cellSize}" 
          fill="${fill}" 
          rx="${cornerRadius}" 
          ry="${cornerRadius}"
        />`;
    });
  });

  return `
    <svg width="${gridWidth}" height="${gridHeight}" xmlns="http://www.w3.org/2000/svg">
      ${svgCells}
    </svg>`;
};

// --- Calculate total contributions ---
const calculateTotalContributions = (weeks) => {
  return weeks.reduce((total, week) => {
    return total + week.contributionDays.reduce((weekTotal, day) => {
      return weekTotal + day.contributionCount;
    }, 0);
  }, 0);
};

// --- Fetch contributions ---
export const command = async (dispatch) => {
  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${githubToken}`,
      },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    const weeks = result.data.user.contributionsCollection.contributionCalendar.weeks;
    const svg = generateSVG(weeks);
    const totalContributions = calculateTotalContributions(weeks);
    dispatch({ type: "SET_DATA", svg, totalContributions });
  } catch (error) {
    console.error("Error fetching GitHub contributions:", error);
    dispatch({
      type: "SET_DATA",
      svg: `<div style="color: #ff6b6b; text-align: center; padding: 10px; font-size: 12px;">
        <div>⚠️ Unable to load</div>
      </div>`,
      totalContributions: 0,
    });
  }
};

export const initialState = { svg: "", totalContributions: 0 };

export const updateState = (event, previousState) => {
  switch (event.type) {
    case "SET_DATA":
      return { 
        ...previousState, 
        svg: event.svg, 
        totalContributions: event.totalContributions 
      };
    default:
      return previousState;
  }
};

// --- Compact Styling ---
import { css } from "uebersicht";

const container = css`
  position: absolute;
  left: ${widgetLeft}px;
  top: ${widgetTop}px;
  width: ${widgetWidth}px;
  padding: 12px; // Reduced padding
  background: linear-gradient(135deg, #1e2328 0%, #24292e 100%);
  border-radius: 12px; // Slightly smaller radius
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

const header = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 8px; // Reduced margin
`;

const titleSection = css`
  display: flex;
  align-items: center;
`;

const heading = css`

  font-size: 12px; // Reduced from 16px
  font-weight: 600;
  margin-top: 12spx;
  color: #f0f6fc;
`;

const logo = css`
  width: 12px; // Reduced from 18px
  height: 16px;
  margin-right: 4px; // Reduced margin
  opacity: 0.9;
`;

const statsSection = css`
  font-size: 11px; // Reduced from 12px
  color: #7d8590;
  text-align: right;
  line-height: 1.2;
`;

const contributionCount = css`
  font-weight: 600;
  color: #39d353;
  font-size: 12px; // Slightly larger for readability
`;

const graphContainer = css`
  width: 100%;
  display: flex;
  justify-content: center;
`;

// --- Render Widget ---
export const render = ({ svg, totalContributions }) => {
  return (
    <div className={container}>
      <div className={header}>
        <div className={titleSection}>
          <svg className={logo} viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          <h3 className={heading}>GitHub</h3>
        </div>
        <div className={statsSection}>
          <div className={contributionCount}>{totalContributions}</div>
          <div>commits</div>
        </div>
      </div>
      
      <div className={graphContainer}>
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </div>
  );
};