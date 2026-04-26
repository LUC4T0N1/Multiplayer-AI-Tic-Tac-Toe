import { motion } from 'framer-motion';

const HOME_PALETTE = [
  '#dd00ff', // vivid purple
  '#9900ee', // deep purple
  '#5533ff', // indigo
  '#0055ff', // electric blue
  '#0099ff', // sky blue
  '#00ccff', // cyan
  '#ff0088', // hot magenta
  '#ff2d78', // neon pink
  '#ff66bb', // soft pink
  '#ff5500', // vivid orange
  '#ff9900', // amber
  '#ff3300', // red-orange
];

// Row y-values define each streak column's tile height
const ROWS = [235, 252, 150, 253, 204, 134, 179, 299, 215, 281, 158, 210];

const START_POSITIONS = '0px 220px, 3px 220px, 151.5px 337.5px, 25px 24px, 28px 24px, 176.5px 150px, 50px 16px, 53px 16px, 201.5px 91px, 75px 224px, 78px 224px, 226.5px 230.5px, 100px 19px, 103px 19px, 251.5px 121px, 125px 120px, 128px 120px, 276.5px 187px, 150px 31px, 153px 31px, 301.5px 120.5px, 175px 235px, 178px 235px, 326.5px 384.5px, 200px 121px, 203px 121px, 351.5px 228.5px, 225px 224px, 228px 224px, 376.5px 364.5px, 250px 26px, 253px 26px, 401.5px 105px, 275px 75px, 278px 75px, 426.5px 180px';
const END_POSITIONS = '0px 6800px, 3px 6800px, 151.5px 6917.5px, 25px 13632px, 28px 13632px, 176.5px 13758px, 50px 5416px, 53px 5416px, 201.5px 5491px, 75px 17175px, 78px 17175px, 226.5px 17301.5px, 100px 5119px, 103px 5119px, 251.5px 5221px, 125px 8428px, 128px 8428px, 276.5px 8495px, 150px 9876px, 153px 9876px, 301.5px 9965.5px, 175px 13391px, 178px 13391px, 326.5px 13540.5px, 200px 14741px, 203px 14741px, 351.5px 14848.5px, 225px 18770px, 228px 18770px, 376.5px 18910.5px, 250px 5082px, 253px 5082px, 401.5px 5161px, 275px 6375px, 278px 6375px, 426.5px 6480px';

function FallingPattern({
  colors = HOME_PALETTE,
  backgroundColor = '#050010',
  duration = 150,
  blurIntensity = '0.4em',
  density = 1,
  style,
}) {
  const generateBackgroundImage = () =>
    ROWS.map((y, i) => {
      const c = colors[i % colors.length];
      return [
        `radial-gradient(4px 100px at 0px ${y}px, ${c}, transparent)`,
        `radial-gradient(4px 100px at 300px ${y}px, ${c}, transparent)`,
        `radial-gradient(1.5px 1.5px at 150px ${y / 2}px, ${c} 100%, transparent 150%)`,
      ].join(', ');
    }).join(', ');

  const generateBackgroundSizes = () =>
    ROWS.map(y => `300px ${y}px, 300px ${y}px, 300px ${y}px`).join(', ');

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', ...style }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{ width: '100%', height: '100%' }}
      >
        <motion.div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            zIndex: 0,
            backgroundColor,
            backgroundImage: generateBackgroundImage(),
            backgroundSize: generateBackgroundSizes(),
          }}
          variants={{
            initial: { backgroundPosition: START_POSITIONS },
            animate: {
              backgroundPosition: [START_POSITIONS, END_POSITIONS],
              transition: {
                duration,
                ease: 'linear',
                repeat: Infinity,
              },
            },
          }}
          initial="initial"
          animate="animate"
        />
      </motion.div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          backdropFilter: `blur(${blurIntensity})`,
          backgroundImage: `radial-gradient(circle at 50% 50%, transparent 0, transparent 2px, ${backgroundColor} 2px)`,
          backgroundSize: `${8 * density}px ${8 * density}px`,
        }}
      />
    </div>
  );
}

export default FallingPattern;
