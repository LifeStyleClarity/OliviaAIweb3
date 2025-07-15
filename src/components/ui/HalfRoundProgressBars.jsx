import PropTypes from 'prop-types';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

// Register necessary components
Chart.register(ArcElement, Tooltip, Legend);

function DoughnutChart({ value, total, color, season }) {
  const percentage = (value / total) * 100;

  const data = {
    datasets: [
      {
        data: season === "2" ? [percentage, 100 - percentage] : [percentage],
        backgroundColor: function(context) {
          if (context.dataIndex === 0) {
            if (color === 'bg-white/50') {
              return 'rgba(255, 255, 255, 0.5)';
            }
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return color;

            // Create a radial gradient from the center
            const gradient = ctx.createRadialGradient(
              chartArea.left + chartArea.width/2, 
              chartArea.top + chartArea.height/2, 
              0,
              chartArea.left + chartArea.width/2,
              chartArea.top + chartArea.height/2,
              chartArea.width/2
            );
            gradient.addColorStop(0, '#0AFDE1');
            gradient.addColorStop(1, '#45EF34');
            return gradient;
          }
          return 'transparent';
        },
        borderWidth: 0,
        borderRadius: 10,
        circumference: 240, // Only half circle
        rotation: 240, // Start at the top
      },
    ],
  };

  const options = {
    cutout: '85%',
    rotation: 270,
    circumference: 180,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  return (
    <div className="relative flex items-center justify-center w-[200px] h-[200px]">
      <Doughnut data={data} options={options} />
    </div>
  );
}

DoughnutChart.propTypes = {
  value: PropTypes.number,
  total: PropTypes.number,
  color: PropTypes.string,
  season: PropTypes.string,
};

function HalfRoundProgressBars({ value1, total1, telegramUser, season, backgroundFill = false }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative">
        <DoughnutChart 
          value={value1} 
          total={total1} 
          isTop={false} 
          season={season} 
          color={backgroundFill ? 'bg-white/50' : '#45EF34'} 
        />
        {!backgroundFill && (
          <div className="absolute inset-0 top-12 flex flex-col items-center justify-center">
            <div className="text-[12px] text-white/80 mb-1">
              {telegramUser ? "Connect Wallet" : season === "2" ? "Season 2" : "Season 1"}
            </div>
            <div className="text-xl font-light text-default-300 italic">
              <span className="not-italic font-medium text-2xl" style={{ background: 'linear-gradient(to right, #45EF34, #0AFDE1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {value1}
              </span>
            </div>
            <div className="text-[16px] text-white mb-1">
            {telegramUser ? "Connect Wallet" : season === "2" ? "" : "Locked Points"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

HalfRoundProgressBars.propTypes = {
  value1: PropTypes.number,
  total1: PropTypes.number,
  season: PropTypes.string,
  telegramUser: PropTypes.bool,
  backgroundFill: PropTypes.bool
};

export default HalfRoundProgressBars;
