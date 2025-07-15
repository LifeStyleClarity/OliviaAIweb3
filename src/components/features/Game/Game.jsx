import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const FPS = 60;
const GRAVITY = 20; // Gravity constant for items
// (Not used for onai coins anymore)

// Global variable to hold current difficulty settings.
// (This is updated in loadLevelConfig.)
let currentDifficulty = {
    alienSpeedFactor: 1.0,
    alienBulletCount: 1,
    alienSpawnLimit: 13,
    alienHealth: 100,
    alienIntervalTime: 2500,
    tonSpawnChance: 0.01 // Default fallback if not set in level config
};

// Declare these arrays at the module level so all functions can access them.
let activeIntervals = [];
let activeTimeouts = [];

// --- Helper function to check shield collision ---
function isBulletCollidingWithShield(bullet, rocket) {
    // Set shield radius – adjust this value as needed
    const shieldRadius = rocket.width;
    const rocketCenterX = rocket.x + rocket.width / 2;
    const rocketCenterY = rocket.y + rocket.height / 2;
    const bulletCenterX = bullet.x + bullet.width / 2;
    const bulletCenterY = bullet.y + bullet.height / 2;
    const dx = bulletCenterX - rocketCenterX;
    const dy = bulletCenterY - rocketCenterY;
    return Math.sqrt(dx * dx + dy * dy) <= shieldRadius;
}

// ==========================
// ENGINE FIRE PARTICLE CLASS
// ==========================
class EngineFireParticle {
    constructor(x, y, spread = 9) {
        this.x = x + (Math.random() - 0.5) * spread;
        this.y = y + (Math.random() - 0.5) * spread;
        this.radius = Math.random() * 2 + 2;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.02;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = Math.random() * 10 + 10;
        this.oscillationPhase = Math.random() * Math.PI * 2;
    }
    update(deltaTime) {
        this.x += this.vx * deltaTime + Math.sin(this.oscillationPhase + this.x * 0.05) * 0.5;
        this.y += this.vy * deltaTime;
        this.alpha -= this.decay;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(this.alpha, 0);
        let gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, `rgba(255, 255, 0, ${this.alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 150, 0, ${this.alpha})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    isDead() {
        return this.alpha <= 0;
    }
}

// ==========================
// ALIEN ENGINE FLAME (PARTICLE–BASED)
// ==========================
class AlienEngineFlame {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
    }
    update(deltaTime) {
        // Spawn a new engine fire particle every frame.
        this.particles.push(new EngineFireParticle(this.x, this.y, 10));
        // Update all particles.
        this.particles.forEach((p) => p.update(deltaTime));
        // Remove dead particles.
        this.particles = this.particles.filter((p) => !p.isDead());
    }
    draw(ctx) {
        // Draw all engine fire particles.
        this.particles.forEach((p) => p.draw(ctx));
    }
}

// ==========================
// TON COLLECTIBLE CLASS
// ==========================
class TonCollectible {
    constructor(x, y) {
        this.image = window.gameImages.ton; // Make sure 'ton' is loaded in imageSources
        this.width = 30;
        this.height = 30;
        this.x = x;
        this.y = y;
        // Simple downward speed or random drift
        this.vx = (Math.random() - 0.5) * 50;
        this.vy = Math.random() * 40 + 40; // Downward speed
    }
    update(deltaTime, canvasWidth, canvasHeight) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        // Bounce horizontally if hitting edges
        if (this.x < 0) {
            this.x = 0;
            this.vx = -this.vx;
        } else if (this.x + this.width > canvasWidth) {
            this.x = canvasWidth - this.width;
            this.vx = -this.vx;
        }
        // If it goes off bottom, remove it
        if (this.y > canvasHeight) {
            this.destroy();
        }
    }
    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
    destroy() {
        // Removal handled in the game loop
    }
}

// ==========================
// NEW: ROCKET POWER‑UP COLLECTIBLE CLASS
// ==========================
class RocketCollectible {
    constructor(x, y) {
        // Use the rocketPowerUp image (which is now your missile icon)
        this.image = window.gameImages.rocketPowerUp;
        this.width = 50; // Adjust size as desired
        this.height = 50;
        this.x = x;
        this.y = y;
        // Downward movement with a slight drift
        this.vx = (Math.random() - 0.5) * 50;
        this.vy = Math.random() * 40 + 40;
    }
    update(deltaTime, canvasWidth, canvasHeight) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        // Bounce horizontally if hitting edges
        if (this.x < 0) {
            this.x = 0;
            this.vx = -this.vx;
        } else if (this.x + this.width > canvasWidth) {
            this.x = canvasWidth - this.width;
            this.vx = -this.vx;
        }
        // Remove if it goes off bottom
        if (this.y > canvasHeight) {
            this.destroy();
        }
    }
    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
    destroy() {
        // Removal is handled by filtering the rocketCollectibles array in the game loop.
    }
}

// ==========================
// NEW: TRACTOR BEAM COLLECTIBLE CLASS
// ==========================
class TractorBeamCollectible {
    constructor(x, y) {
        // Use the tractor beam image from public folder
        this.image = window.gameImages.tractorBeam; // make sure this key is in imageSources
        this.width = 50; // Adjust as desired
        this.height = 50;
        this.x = x;
        this.y = y;
        // Downward movement with slight drift
        this.vx = (Math.random() - 0.5) * 50;
        this.vy = Math.random() * 40 + 40;
    }
    update(deltaTime, canvasWidth, canvasHeight) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        // Bounce horizontally if hitting edges
        if (this.x < 0) {
            this.x = 0;
            this.vx = -this.vx;
        } else if (this.x + this.width > canvasWidth) {
            this.x = canvasWidth - this.width;
            this.vx = -this.vx;
        }
        // Remove if it goes off bottom
        if (this.y > canvasHeight) {
            this.destroy();
        }
    }
    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
    destroy() {
        tractorBeamCollectibles = tractorBeamCollectibles.filter((p) => p !== this);
    }
}

// ==========================
// NEW: SHIELD COLLECTIBLE CLASS
// ==========================
class ShieldCollectible {
    constructor(x, y) {
        // Use the shield image
        this.image = window.gameImages.shield;
        this.width = 50;
        this.height = 50;
        this.x = x;
        this.y = y;
        // Downward movement with slight drift
        this.vx = (Math.random() - 0.5) * 50;
        this.vy = Math.random() * 40 + 40;
    }
    update(deltaTime, canvasWidth, canvasHeight) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        if (this.x < 0) {
            this.x = 0;
            this.vx = -this.vx;
        } else if (this.x + this.width > canvasWidth) {
            this.x = canvasWidth - this.width;
            this.vx = -this.vx;
        }
        if (this.y > canvasHeight) {
            this.destroy();
        }
    }
    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
    destroy() {
        shieldCollectibles = shieldCollectibles.filter((s) => s !== this);
    }
}

// ==========================
// NEW: SMOKE PARTICLE CLASS (for beam effects)
// ==========================
class SmokeParticle {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 10;
        this.y = y + (Math.random() - 0.5) * 10;
        this.radius = Math.random() * 3 + 2;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.01;
    }
    update(deltaTime) {
        // Slowly drift upward
        this.y -= deltaTime * 20;
        this.alpha -= this.decay;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(this.alpha, 0);
        ctx.fillStyle = 'rgba(100,100,100,1)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }
    isDead() {
        return this.alpha <= 0;
    }
}

// ==========================
// NEW: BOSS LASER BEAM CLASS
// ==========================
class BossLaserBeam {
    constructor(boss) {
        this.boss = boss;
        this.startTime = performance.now();
        this.duration = 1000; // 1 second duration; adjust if needed
        this.active = true;
        // Beam width is now 1/4 of the boss's width
        this.baseWidth = boss.width / 5;
        this.beamWidth = this.baseWidth;
        this.smokeParticles = [];
        this.rect = { x: 0, y: 0, width: this.beamWidth, height: 0 };
    }
    update(canvas) {
        const elapsed = performance.now() - this.startTime;
        if (elapsed > this.duration) {
            this.active = false;
        }
        // Make the beam pulse by oscillating its width slightly
        this.beamWidth = this.baseWidth * (1 + 0.1 * Math.sin(elapsed / 50));

        // Align the beam with the boss's position
        this.x = this.boss.x + this.boss.width / 2;
        this.y = this.boss.y + this.boss.height;

        // Update collision rectangle
        this.rect.x = this.x - this.beamWidth / 2;
        this.rect.y = this.y;
        this.rect.width = this.beamWidth;
        this.rect.height = canvas.height - this.y;

        // Spawn smoke particles along the top of the beam
        if (Math.random() < 0.3) {
            this.smokeParticles.push(new SmokeParticle(
                this.x + (Math.random() - 0.5) * this.beamWidth,
                this.y
            ));
        }
        this.smokeParticles.forEach(p => p.update(0.016));
        this.smokeParticles = this.smokeParticles.filter(p => !p.isDead());
    }
    draw(ctx, canvas) {
        ctx.save();
        // Add shadow to the beam for a glowing effect
        ctx.shadowBlur = 500;
        ctx.shadowColor = 'blue';

        // Blue gradient for the beam
        const gradient = ctx.createLinearGradient(0, this.y, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0, 0, 255, 0.9)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');
        ctx.fillStyle = gradient;

        const beamX = this.x - this.beamWidth / 2;
        const beamY = this.y;
        ctx.fillRect(beamX, beamY, this.beamWidth, canvas.height - beamY);
        ctx.restore();

        // Draw smoke particles on top of the beam
        this.smokeParticles.forEach(p => p.draw(ctx));
    }
}

// =================================================================
// ORIGINAL GAME CODE BELOW (with modifications for boss laser, rocket power‑up, tractor beam, and shield pickup)
// =================================================================

// Global arrays for new power-ups:
let tractorBeamCollectibles = [];
let shieldCollectibles = []; // NEW: Array for shield pickups

// Global flag for tractor beam effect and its duration.
let tractorBeamActive = false;
const tractorBeamDuration = 3000; // Duration in ms for tractor beam effect

function activateTractorBeam() {
    tractorBeamActive = true;
    // The effect lasts for tractorBeamDuration
    setTimeout(() => {
        tractorBeamActive = false;
    }, tractorBeamDuration);
}

// Spawn functions for Tractor Beam pickup:
function spawnTractorBeamCollectible(canvas) {
    const x = Math.random() * (canvas.width - 30);
    const y = -30;
    tractorBeamCollectibles.push(new TractorBeamCollectible(x, y));
    setRandomTractorBeam(canvas);
}

function setRandomTractorBeam(canvas) {
    const randomInterval = randomFloat(20000, 50000);
    const timeoutId = setTimeout(() => {
        spawnTractorBeamCollectible(canvas);
    }, randomInterval);
    activeTimeouts.push(timeoutId);
}

// Spawn functions for Shield pickup:
function spawnShieldCollectible() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const x = Math.random() * (canvas.width - 30);
    const y = -30;
    const shieldItem = new ShieldCollectible(x, y);

    shieldCollectibles.push(shieldItem);

    // Explode if not collected within 3s
    const explodeTimeout = setTimeout(() => {
        if (shieldCollectibles.includes(shieldItem)) {
            createParticleExplosion(
                shieldItem.x + shieldItem.width / 2,
                shieldItem.y + shieldItem.height / 2,
                20
            );
            shieldItem.destroy();
        }
    }, 3000);

    activeTimeouts.push(explodeTimeout);

    setRandomShieldCollectible();
}


const Game = ({ galaxyPlayer, onGameOver, selectedNft, userId }) => {
    const canvasRef = useRef(null);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [slowConnection, setSlowConnection] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [adController, setAdController] = useState(null);
    const [isAdLoading, setIsAdLoading] = useState(false);
    const [isAdReady, setIsAdReady] = useState(false);
    const [levelTransition, setLevelTransition] = useState(null);
    const levelTransitionRef = useRef(null);

    let ctx;

    // For TON collectible: each TON icon’s value is 0.0001.
    const TON_VALUE = 0.0001;
    let tonCount = 0;

    // ---------------------------
    // CAMERA SHAKE EFFECT
    // ---------------------------
    let shakeTime = 0;
    const applyCameraShake = (ctx) => {
        if (shakeTime > 0) {
            const shakeMagnitude = 50;
            const offsetX = (Math.random() - 0.5) * shakeMagnitude;
            const offsetY = (Math.random() - 0.5) * shakeMagnitude;
            ctx.translate(offsetX, offsetY);
            shakeTime -= 1;
        }
    };

    // ================================================================
    // LEVEL CONFIGURATION (including difficulty settings)
    // ================================================================
    let currentBackgroundColor = 'black';
    let currentStarfieldExtras = [];
    let currentEnemySprites = {};

    const levelConfigs = {
        1: {
            backgroundColor: 'black',
            starfieldExtras: [],
            enemySprites: {
                alien: "/rocket.png",
                boss: "/BADGUY.png"
            },
            difficulty: {
                alienSpeedFactor: 1.0,
                alienBulletCount: 1,
                alienSpawnLimit: 18,
                alienHealth: 2,
                alienIntervalTime: 2000,
                tonSpawnChance: 0.0020,
                bulletSpread: 0
            }
        },
        2: {
            backgroundColor: '#002b55',
            starfieldExtras: [
                {
                    image: "/dryhotplanet-lvl1.png",
                    x: -20,
                    y: 200,
                    width: 600,
                    height: 600,
                    parallaxSpeed: 0.2,
                    opacity: 0.5
                }
            ],
            enemySprites: {
                alien: "/rocket 2.png",
                boss: "/BADGUY.png"
            },
            difficulty: {
                alienSpeedFactor: 1.0,
                alienBulletCount: 2,
                alienSpawnLimit: 18,
                alienHealth: 2,
                alienIntervalTime: 2200,
                tonSpawnChance: 0.0020,
                bulletSpread: 5
            }
        },
        3: {
            backgroundColor: '#5b4943',
            starfieldExtras: [
                {
                    image: "/exoplanetl-lvl3.png",
                    x: 120,
                    y: 80,
                    width: 600,
                    height: 600,
                    parallaxSpeed: 0.2
                }
            ],
            enemySprites: {
                alien: "/rocket 3.png",
                boss: "/BADGUY.png"
            },
            difficulty: {
                alienSpeedFactor: 1.1,
                alienBulletCount: 2,
                alienSpawnLimit: 4,
                alienHealth: 3,
                alienIntervalTime: 2200,
                tonSpawnChance: 0.02,
                bulletSpread: 10
            }
        },
        4: {
            backgroundColor: '#464646',
            starfieldExtras: [
                {
                    image: "/iceplanet-lvl4.png",
                    x: 80,
                    y: 120,
                    width: 600,
                    height: 600,
                    parallaxSpeed: 0.2
                }
            ],
            enemySprites: {
                alien: "/rocket4.png",
                boss: "/BADGUY.png"
            },
            difficulty: {
                alienSpeedFactor: 1.3,
                alienBulletCount: 4,
                alienSpawnLimit: 5,
                alienHealth: 4,
                alienIntervalTime: 2200,
                tonSpawnChance: 0.0020,
                bulletSpread: 15
            }
        },
        5: {
            backgroundColor: '#070707',
            starfieldExtras: [
                {
                    image: "/lava_planet-lvl5.png",
                    x: 150,
                    y: 150,
                    width: 600,
                    height: 600,
                    parallaxSpeed: 0.2
                }
            ],
            enemySprites: {
                alien: "/rocket5.png",
                boss: "/BADGUY.png"
            },
            difficulty: {
                alienSpeedFactor: 1.3,
                alienBulletCount: 5,
                alienSpawnLimit: 5,
                alienHealth: 5,
                alienIntervalTime: 2200,
                tonSpawnChance: 0.0020,
                bulletSpread: 40
            }
        },
        6: {
            backgroundColor: '#876d00',
            starfieldExtras: [
                {
                    image: "/machine_world-lvl6.png",
                    x: 90,
                    y: 90,
                    width: 600,
                    height: 600,
                    parallaxSpeed: 0.2
                }
            ],
            enemySprites: {
                alien: "/rocket6.png",
                boss: "/BADGUY.png"
            },
            difficulty: {
                alienSpeedFactor: 1.3,
                alienBulletCount: 6,
                alienSpawnLimit: 6,
                alienHealth: 6,
                alienIntervalTime: 2200,
                tonSpawnChance: 0.0020,
                bulletSpread: 45
            }
        },
        7: {
            backgroundColor: '#1d1c1a',
            starfieldExtras: [
                {
                    image: "/moon-lvl7.png",
                    x: 110,
                    y: 110,
                    width: 600,
                    height: 600,
                    parallaxSpeed: 0.2
                }
            ],
            enemySprites: {
                alien: "/rocket7.png",
                boss: "/BADGUY.png"
            },
            difficulty: {
                alienSpeedFactor: 1.3,
                alienBulletCount: 4,
                alienSpawnLimit: 7,
                alienHealth: 4,
                alienIntervalTime: 2200,
                tonSpawnChance: 0.02,
                bulletSpread: 35
            }
        },
        8: {
            backgroundColor: '#070707',
            starfieldExtras: [
                {
                    image: "/exoplanetl-lvl3.png",
                    x: 130,
                    y: 130,
                    width: 800,
                    height: 800,
                    parallaxSpeed: 0.2
                }
            ],
            enemySprites: {
                alien: "/rocket8.png",
                boss: "/BADGUY.png"
            },
            difficulty: {
                alienSpeedFactor: 1.3,
                alienBulletCount: 5,
                alienSpawnLimit: 7,
                alienHealth: 4,
                alienIntervalTime: 2200,
                tonSpawnChance: 0.02,
                bulletSpread: 40
            }
        },
        9: {
            backgroundColor: '#c09976',
            starfieldExtras: [
                {
                    image: "/shattered_planet-lvl9.png",
                    x: 140,
                    y: 100,
                    width: 600,
                    height: 600,
                    parallaxSpeed: 0.2
                }
            ],
            enemySprites: {
                alien: "/rocket9.png",
                boss: "/BADGUY.png"
            },
            difficulty: {
                alienSpeedFactor: 1.3,
                alienBulletCount: 5,
                alienSpawnLimit: 7,
                alienHealth: 5,
                alienIntervalTime: 1300,
                tonSpawnChance: 0.02,
                bulletSpread: 40
            }
        },
        10: {
            backgroundColor: '#000000',
            starfieldExtras: [
                {
                    image: "/sphereplanet-lvl10.png",
                    x: 100,
                    y: 140,
                    width: 800,
                    height: 800,
                    parallaxSpeed: 0.2
                }
            ],
            enemySprites: {
                alien: "/rocket10.png",
                boss: "/BADGUY.png"
            },
            difficulty: {
                alienSpeedFactor: 1.3,
                alienBulletCount: 6,
                alienSpawnLimit: 8,
                alienHealth: 6,
                alienIntervalTime: 2200,
                tonSpawnChance: 0.02,
                bulletSpread: 45
            }
        },
        11: {
            backgroundColor: '#000000',
            starfieldExtras: [
                {
                    image: "/sun-lvl11.png",
                    x: 120,
                    y: 120,
                    width: 800,
                    height: 800,
                    parallaxSpeed: 0.2
                }
            ],
            enemySprites: {
                alien: "/rocket11.png",
                boss: "/BADGUY.png"
            },
            difficulty: {
                alienSpeedFactor: 1.3,
                alienBulletCount: 6,
                alienSpawnLimit: 20,
                alienHealth: 6,
                alienIntervalTime: 1100,
                tonSpawnChance: 0.02,
                bulletSpread: 45
            }
        }
    };

    const loadLevelConfig = (newLevel) => {
        const config = levelConfigs[newLevel];
        if (!config) return;
        currentBackgroundColor = config.backgroundColor;
        currentStarfieldExtras = config.starfieldExtras;
        currentEnemySprites = config.enemySprites;
        if (config.difficulty) {
            currentDifficulty = config.difficulty;
        }
    };

    loadLevelConfig(1);

    // ----------------------
    // IMAGE LOADING LOGIC
    // ----------------------
    const imageSources = {
        rocket: selectedNft ? selectedNft.metadata.image : "/spaceship.png",
        // Use the Missile Icon for the rocket power‑up.
        // NOTE: Make sure this file is in your public folder.
        rocketPowerUp: "/Missile Icon.png",
        saveAndExit: "/save_svg.svg",
        shield: "/shield.png", // Shield pickup image
        laserPowerUpImage: "/laser_store.png",
        alien: "/rocket.png",
        onai: "/Olivia-ai-LOGO.png",
        life: "/life.png",
        laser: "/laser.png",
        boss: "/boss.png",
        asteroid: "/rotating-asteroid-hand-drawn-in-photoshop-after-effects-v0-8fpmswc0avmb1.png",
        levelPlaceholder: "/dryvenuslikeplanet-lvl2.png",
        ton: "/tonicon.webp", // The TON icon
        tractorBeam: "/tractor beam.png" // Tractor Beam power‑up image
    };

    const preloadImages = (sources, progressCallback, callback) => {
        const images = {};
        let loadedImages = 0;
        const numImages = Object.keys(sources).length;
        for (let src in sources) {
            images[src] = new Image();
            images[src].src = sources[src];
            images[src].onload = images[src].onerror = () => {
                loadedImages++;
                progressCallback((loadedImages / numImages) * 100);
                if (loadedImages === numImages) {
                    callback(images);
                }
            };
        }
    };

    useEffect(() => {
        let timeoutId;
        preloadImages(imageSources, setLoadingProgress, (loadedImages) => {
            window.gameImages = loadedImages;
            setImagesLoaded(true);
            clearTimeout(timeoutId);
        });
        timeoutId = setTimeout(() => {
            setSlowConnection(true);
        }, 7000);
        timeoutId = setTimeout(() => {
            setImagesLoaded(true);
        }, 10000);
        return () => clearTimeout(timeoutId);
    }, []);

    //AD
    useEffect(() => {
        const blockId = '8645'; // Replace with your actual blockId

        const loadAdsGramScript = () => {
            return new Promise((resolve, reject) => {
                if (document.getElementById('adsgram-sdk')) {
                    resolve(); // Script already exists
                    return;
                }

                const script = document.createElement('script');
                script.id = 'adsgram-sdk';
                script.src = 'https://sad.adsgram.ai/js/sad.min.js';
                script.async = true;

                script.onload = () => {
                    console.log('AdsGram SDK script loaded.');
                    resolve();
                    // setIsAdReady(true)
                };

                script.onerror = () => {
                    console.error('Failed to load AdsGram SDK script.');
                    reject(new Error('Failed to load AdsGram SDK script.'));
                    // setIsAdReady(false)
                };

                document.head.appendChild(script);
            });
        };

        const initializeAdsGram = async () => {
            try {
                await loadAdsGramScript();

                if (window.Adsgram && window.Adsgram.init) {
                    const controller = window.Adsgram.init({ blockId: blockId });
                    setAdController(controller);
                    console.log('AdsGram SDK initialized.');
                    setIsAdReady(true)
                } else {
                    setIsAdReady(false)
                    console.error('AdsGram SDK is not available after script load.');
                }
            } catch (error) {
                setIsAdReady(false)
                console.error('Error initializing AdsGram SDK:', error);
            }
        };
        initializeAdsGram();
    }, []);

    //END OF AD

    // ----------------------
    // STARFIELD (with shooting stars)
    // ----------------------
    let stars = [];
    let frameCount = 0;
    const STAR_COUNT = 500;
    const SHOOTING_STAR_CHANCE = 100;
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomFloat = (min, max) => Math.random() * (max - min) + min;

    class Star {
        constructor(canvasWidth, canvasHeight, isShooting = false) {
            this.canvasWidth = canvasWidth;
            this.canvasHeight = canvasHeight;
            this.size = randomFloat(1, 4);
            this.baseSpeed = this.size * 2.5;
            this.baseBrightness = randomInt(100, 840);
            this.x = randomInt(0, canvasWidth);
            this.y = randomInt(0, canvasHeight);
            this.offset = randomFloat(0, 10 * Math.PI);
            this.isShooting = isShooting;
            this.trailPositions = [];
            this.trailLength = isShooting ? randomInt(30, 60) : 0;
            if (this.isShooting) {
                const angle = randomFloat(0, 2 * Math.PI);
                const shootSpeed = randomFloat(2.0, 5.0);
                this.dx = Math.cos(angle) * shootSpeed;
                this.dy = Math.sin(angle) * shootSpeed;
            } else {
                this.dx = 0;
                this.dy = this.baseSpeed;
            }
        }
        update() {
            this.x += this.dx;
            this.y += this.dy;
            if (this.isShooting) {
                this.trailPositions.push({ x: this.x, y: this.y });
                if (this.trailPositions.length > this.trailLength) {
                    this.trailPositions.shift();
                }
            }
            if (
                this.x < 0 ||
                this.x > this.canvasWidth ||
                this.y < 0 ||
                this.y > this.canvasHeight
            ) {
                this.respawn();
            }
        }
        respawn() {
            this.size = randomFloat(1, 4);
            this.baseSpeed = this.size * 0.4;
            this.baseBrightness = randomInt(100, 240);
            this.offset = randomFloat(0, 2 * Math.PI);
            this.isShooting = false;
            this.trailPositions = [];
            this.trailLength = 0;
            this.x = randomInt(0, this.canvasWidth);
            this.y = 0;
            this.dx = 0;
            this.dy = this.baseSpeed;
        }
        getBrightness(fc) {
            const amplitude = 100;
            const freq = 0.05;
            const pulse = Math.sin(fc * freq + this.offset);
            let val = this.baseBrightness + amplitude * pulse;
            return Math.max(0, Math.min(255, val));
        }
        draw(ctx, fc) {
            const brightness = this.getBrightness(fc);
            const color = `rgb(${brightness},${brightness},${brightness})`;
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.size, this.size);
            if (this.isShooting) {
                for (let i = 0; i < this.trailPositions.length - 1; i++) {
                    const start = this.trailPositions[i];
                    const end = this.trailPositions[i + 1];
                    let alpha = i / (this.trailPositions.length - 1);
                    ctx.strokeStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(start.x, start.y);
                    ctx.lineTo(end.x, end.y);
                    ctx.stroke();
                }
            }
        }
    }

    function initStarfield(width, height) {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push(new Star(width, height, false));
        }
        for (let i = 0; i < Math.floor(STAR_COUNT / 10); i++) {
            const s = new Star(width, height, true);
            s.x = randomInt(0, width / 4);
            s.y = randomInt(0, height / 4);
            stars.push(s);
        }
    }

    function spawnShootingStar(width, height) {
        const s = new Star(width, height, true);
        s.x = randomInt(0, width / 6);
        s.y = randomInt(0, height / 5);
        stars.push(s);
    }

    function updateStarfield(width, height) {
        frameCount++;
        if (randomInt(0, SHOOTING_STAR_CHANCE) === 0) {
            spawnShootingStar(width, height);
        }
        stars.forEach((star) => star.update());
    }

    function drawStarfield(ctx) {
        stars.forEach((star) => {
            star.draw(ctx, frameCount);
        });
    }

    ///////////////////////////////
    // PARTICLE-BASED EXPLOSIONS
    ///////////////////////////////
    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * 2 * Math.PI;
            const speed = Math.random() * 200 + 100;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.size = Math.random() * 1 + 2;
            const hue = Math.floor(Math.random() * 40);
            const saturation = 100;
            const lightness = Math.floor(Math.random() * 20) + 40;
            this.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            this.life = 1.0;
        }
        update(deltaTime) {
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
            this.life -= deltaTime;
        }
        draw(ctx) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            const alpha = Math.max(this.life, 0);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        }
        isDead() {
            return this.life <= 0;
        }
    }

    class ParticleExplosion {
        constructor(x, y, numParticles = 20) {
            this.particles = [];
            for (let i = 0; i < numParticles; i++) {
                this.particles.push(new Particle(x, y));
            }
            this.done = false;
        }
        update(deltaTime) {
            this.particles.forEach((p) => p.update(deltaTime));
            this.particles = this.particles.filter((p) => !p.isDead());
            if (this.particles.length === 0) {
                this.done = true;
            }
        }
        draw(ctx) {
            this.particles.forEach((p) => p.draw(ctx));
        }
    }

    ///////////////////////////////
    // DUST TRAIL PARTICLES (for Asteroids)
    ///////////////////////////////
    class DustParticle {
        constructor(x, y, spread = 10) {
            this.x = x + (Math.random() - 0.8) * spread;
            this.y = y + (Math.random() - 0.9) * spread;
            this.radius = Math.random() * 0.3 + 0.9;
            this.alpha = 1;
            this.decay = Math.random() * 0.05 + 0.001;
            this.vx = -Math.random() * 2;
            this.vy = (Math.random() - 0.5) * 1;
            this.oscillationPhase = Math.random() * Math.PI * 2;
        }
        update(deltaTime) {
            this.x += this.vx * deltaTime + Math.sin(this.oscillationPhase + this.y * 0.05) * 0.5;
            this.y += this.vy * deltaTime;
            this.alpha -= this.decay;
        }
        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(this.alpha, 0);
            ctx.fillStyle = "rgba(200,200,200,1)";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        isDead() {
            return this.alpha <= 0;
        }
    }

    ///////////////////////////////
    // ASTEROID DEBRIS
    ///////////////////////////////
    class AsteroidDebris {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * 2 * Math.PI;
            const speed = Math.random() * 50 + 50;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 100 - 50;
            this.size = Math.random() * 10 + 10;
            const shade = Math.floor(Math.random() * 80 + 80);
            this.color = `rgb(${shade}, ${shade}, ${shade})`;
        }
        update(deltaTime) {
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
            this.rotation += this.rotationSpeed * deltaTime;
        }
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    // ----------------------
    // Define level thresholds.
    // ----------------------
    const levelThresholds = [100, 250, 400, 500, 600, 750, 800, 950, 1000, 1500];
    // const levelThresholds = [2, 4, 6, 8, 10, 12, 13, 15, 18, 22];

    useEffect(() => {
        if (!imagesLoaded && !isAdReady) return;
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = canvas.offsetHeight;

        initStarfield(canvas.width, canvas.height);

        // Arrays for game objects
        let asteroids = [];
        let debris = [];
        let dustParticles = [];
        let bullets = [];
        let aliens = [];
        let onais = [];
        let lasers = [];
        let alienBullets = [];
        let bossBullets = [];
        let lifePickups = [];
        let boss = null;
        let bossSpawned = false;
        let firedRockets = [];
        // NEW: Store TON collectibles
        let tonCollectibles = [];
        // NEW: Store Rocket Power‑Up collectibles
        let rocketCollectibles = [];

        const keys = {};
        let activeIntervals = [];
        let activeTimeouts = [];

        let bulletSpeedFactor = 1;
        let alienLimit = currentDifficulty.alienSpawnLimit;
        let lifeSpawnInterval = Math.floor(Math.random() * (60000 - 120000) + 20000);

        let rocket;
        let animationFrame;
        let gameOverTriggered = false;
        let score = 0;
        let onaiScore = 0;
        let lives = 3;
        let level = 1; // INITIAL LEVELs
        let autoShoot = false;
        let blueAutoShoot = false;
        let autoShootTimeout;
        let laserCooldown = false;

        let shield = 0;
        let maxShield = 0;

        let showBossWarning = false;
        let bossWarningTimeout;
        let storedBossX = null;
        let storedBossY = null;

        let particleExplosions = [];

        // NEW: Array to hold active boss laser beams
        let bossLaserBeams = [];

        // NEW: Function to apply nuke effect – subtract 2 hits from every enemy
        const nukeAllEnemies = () => {
            aliens.forEach((alien) => {
                alien.hit();
                alien.hit();
            });
            if (boss) {
                boss.hit();
                boss.hit();
            }
        };

        function checkForBossSpawn() {
            if (bossSpawned || bossWarningTimeout) return;
            // changed from === to >= so next boss spawns reliably
            if (level < 11 && score >= levelThresholds[level - 1]) {
                asteroids = [];
                onais = [];
                lifePickups = [];
                stopSpawning();
                bossWarningTimeout = setTimeout(() => {
                    boss = new Boss();
                    bossSpawned = true;
                    bossWarningTimeout = null;
                    stopSpawning();
                }, 3000);
            }
        }

        if (selectedNft) {
            const shieldAttribute = selectedNft.metadata.attributes.find(
                (attr) => attr.trait_type === 'Shield'
            );
            if (shieldAttribute) {
                shield = parseInt(shieldAttribute.value, 10);
                maxShield = shield;
            }
        } else if (galaxyPlayer.ship_upgrades != null) {
            if (galaxyPlayer.ship_upgrades[3].Shield > 0) {
                shield = galaxyPlayer.ship_upgrades[3].Shield;
                maxShield = shield;
            }
        }

        let rocketPowerUpImage = window.gameImages.rocketPowerUp;
        let saveAndExitImage = window.gameImages.saveAndExit;
        let rocketUses = 0;
        if (selectedNft) {
            const rocketsAttribute = selectedNft.metadata.attributes.find(
                (attr) => attr.trait_type === 'Rockets'
            );
            if (rocketsAttribute) {
                rocketUses = parseInt(rocketsAttribute.value, 10);
            }
        } else if (galaxyPlayer.ship_upgrades != null) {
            if (galaxyPlayer.ship_upgrades[0].Rockets > 0) {
                rocketUses = galaxyPlayer.ship_upgrades[0].Rockets;
            }
        }

        let laserPowerUpImage = window.gameImages.laserPowerUpImage;
        let laserUses = 0;
        if (galaxyPlayer.ship_upgrades != null) {
            if (galaxyPlayer.ship_upgrades[2].Lasers > 0) {
                laserUses = galaxyPlayer.ship_upgrades[2].Lasers;
            }
        }

        const increaseDifficulty = () => {
            restartSpawning();
        };

        const resetDifficulty = () => { };

        function createParticleExplosion(x, y, num = 20) {
            particleExplosions.push(new ParticleExplosion(x, y, num));
        }

        function showShieldImpact(shipX, shipY) {
            // Draw a temporary green explosion to show shield impact.
            const canvas = document.querySelector("canvas");
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            ctx.save();
            ctx.beginPath();
            ctx.arc(shipX, shipY, 20, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(57,255,20,0.5)';
            ctx.fill();
            ctx.restore();
        }

        const isTimeBetween9And10PM = () => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();
            return currentHour === 21;
        };

        const isTimeBetween11And12PM = () => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();
            return currentHour === 11;
        };

        // ============================
        // PLAYER SHIP (Rocket) CLASS
        // ============================
        class Rocket {
            constructor() {
                this.image = window.gameImages.rocket;
                this.width = selectedNft ? 70 : 70;
                this.height = selectedNft ? 70 : 70;
                this.x = canvas.width / 2 - this.width / 2;
                this.y = canvas.height - this.height - 10;
                const baseSpeed = 300;
                let speedMultiplier = 1;
                if (selectedNft) {
                    const speedAttribute = selectedNft.metadata.attributes.find(
                        (attr) => attr.trait_type === 'Speed'
                    );
                    if (speedAttribute) {
                        const speedValue = parseInt(speedAttribute.value, 10);
                        speedMultiplier = 1 + speedValue / 12;
                    }
                } else if (galaxyPlayer.ship_upgrades != null) {
                    if (galaxyPlayer.ship_upgrades[4].Speed > 0) {
                        const speedValue = galaxyPlayer.ship_upgrades[4].Speed;
                        speedMultiplier = 1 + speedValue / 12;
                    }
                }
                this.speed = baseSpeed * speedMultiplier;
                this.touchX = null;
                this.touchY = null;
                // NEW: Temporary shield from shield pickup; lasts for 5 hits.
                this.activeShield = 0;
            }
            draw() {
                ctx.save();
                //const scaleFactor = 1 + 0 * Math.sin(performance.now() / 200);
                ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
                //ctx.scale(scaleFactor, scaleFactor);
                ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
                ctx.restore();
                // Draw a glowing circle if temporary shield is active
                if (this.activeShield > 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width, 0, Math.PI * 2);
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = 'rgba(57,255,20,0.8)';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'rgba(57,255,20,0.8)';
                    ctx.stroke();
                    ctx.restore();
                }
            }
            update(deltaTime) {
                const distance = this.speed * deltaTime;
                if (keys['ArrowLeft'] && this.x > 0) this.x -= distance;
                if (keys['ArrowRight'] && this.x < canvas.width - this.width) this.x += distance;
                if (keys['ArrowUp'] && this.y > 0) this.y -= distance;
                if (keys['ArrowDown'] && this.y < canvas.height - this.height) this.y += distance;
                if (this.touchX !== null && this.touchY !== null) {
                    if (this.touchX < this.x + this.width / 2 && this.x > 0) this.x -= distance;
                    if (this.touchX > this.x + this.width / 2 && this.x < canvas.width - this.width) this.x += distance;
                    if (this.touchY < this.y + this.height / 2 && this.y > 0) this.y -= distance;
                    if (this.touchY > this.y + this.height / 2 && this.y < canvas.height - this.height) this.y += distance;
                }
            }
        }

        class FiredRocket {
            constructor(x, y) {
                this.image = window.gameImages.rocketPowerUp;
                this.x = x;
                this.y = y;
                this.width = 50;
                this.height = 50;
                this.speed = 500;
            }
            draw() {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
            update(deltaTime) {
                this.y -= this.speed * deltaTime;
                if (this.y <= canvas.height / 2) {
                    createParticleExplosion(this.x, this.y, 30);
                    // Call nukeAllEnemies to subtract 2 hits from every enemy.
                    nukeAllEnemies();
                    this.destroy();
                }
            }
            destroy() {
                firedRockets = firedRockets.filter((rocket) => rocket !== this);
            }
        }

        // ============================
        // PLAYER BULLET (Glowing Laser)
        // ============================
        class Bullet {
            constructor(x, y, dx = 0, dy = -800, color = 'green') {
                this.width = 5;
                this.height = 30;
                this.x = x;
                this.y = y;
                this.dx = dx;
                this.dy = dy * bulletSpeedFactor;
                this.color = color;
            }
            draw() {
                ctx.save();
                const gradient = ctx.createLinearGradient(
                    this.x, this.y,
                    this.x, this.y + this.height
                );
                gradient.addColorStop(0, `rgb(255, 149, 0)`);
                gradient.addColorStop(1, `rgba(92, 0, 0, 0)`);
                ctx.fillStyle = gradient;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.restore();
            }
            update(deltaTime) {
                this.x += this.dx * deltaTime;
                this.y += this.dy * deltaTime;
                if (this.y < 0 || this.y > canvas.height) {
                    this.destroy();
                }
            }
            destroy() {
                bullets = bullets.filter((b) => b !== this);
                alienBullets = alienBullets.filter((b) => b !== this);
                bossBullets = bossBullets.filter((b) => b !== this);
            }
        }

        class BossBullet {
            constructor(x, y, dx, dy, color = 'red') {
                this.width = 5;
                this.height = 30;
                this.x = x;
                this.y = y;
                this.dx = dx;
                this.dy = dy;
                this.color = color;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
            update(deltaTime) {
                this.x += this.dx * deltaTime;
                this.y += this.dy * deltaTime;
                if (this.y < 0 || this.y > canvas.height) this.destroy();
            }
            destroy() {
                bossBullets = bossBullets.filter((b) => b !== this);
            }
        }

        class RocketBullet {
            constructor(x, y, dx = 0, dy = -800, color = 'green') {
                this.width = 5;
                this.height = 20;
                this.x = x;
                this.y = y;
                this.dx = dx;
                this.dy = dy;
                this.color = blueAutoShoot ? 'blue' : color;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
            update(deltaTime) {
                this.x += this.dx * deltaTime;
                this.y += this.dy * deltaTime;
                if (this.y < 0 || this.y > canvas.height) this.destroy();
            }
            destroy() {
                bullets = bullets.filter((b) => b !== this);
            }
        }

        // ---------------------------
        // ENEMY CLASS (Alien)
        // ---------------------------
        class Alien {
            constructor() {
                this.image = new Image();
                this.image.src = currentEnemySprites.alien || window.gameImages.alien.src;
                this.width = 70;
                this.height = 70;
                this.x = Math.random() * (canvas.width - this.width);
                this.y = -this.height;
                this.difficulty = { ...currentDifficulty };
                this.speedY = (Math.random() * 100 + 150) * this.difficulty.alienSpeedFactor;
                this.speedX = (Math.random() * 100 - 50) * this.difficulty.alienSpeedFactor;
                this.shield = this.difficulty.alienHealth;
                this.shootCooldown = 0;
                this.shootInterval = 1;
                this.isDestroyed = false;
                this.flame = new AlienEngineFlame(this.x + this.width / 10, this.y);
            }
            draw() {
                this.flame.draw(ctx);
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
            update(deltaTime) {
                this.y += this.speedY * deltaTime;
                this.x += this.speedX * deltaTime;
                if (this.x <= 0 || this.x >= canvas.width - this.width) {
                    this.speedX = -this.speedX;
                }
                if (this.y > canvas.height) {
                    this.destroy();
                }
                if (this.shootCooldown > 0) {
                    this.shootCooldown -= deltaTime;
                }
                if (this.shootCooldown <= 0) {
                    this.shoot();
                    this.shootCooldown = this.shootInterval;
                }
                this.flame.x = this.x + this.width / 2;
                this.flame.y = this.y;
                this.flame.update(deltaTime);
            }
            shoot() {
                const bulletCount = this.difficulty.alienBulletCount;
                if (bulletCount === 1) {
                    alienBullets.push(
                        new Bullet(
                            this.x + this.width / 2,
                            this.y + this.height,
                            0,
                            370,
                            this.difficulty.bulletColor || 'red'
                        )
                    );
                } else {
                    const spread = (this.difficulty.bulletSpread * Math.PI) / 180;
                    const startAngle = Math.PI / 2 - spread / 2;
                    const angleStep = spread / (bulletCount - 1);
                    for (let i = 0; i < bulletCount; i++) {
                        const angle = startAngle + i * angleStep;
                        const dx = Math.cos(angle) * 370;
                        const dy = Math.sin(angle) * 370;
                        alienBullets.push(
                            new Bullet(
                                this.x + this.width / 2,
                                this.y + this.height,
                                dx,
                                dy,
                                this.difficulty.bulletColor || 'red'
                            )
                        );
                    }
                }
            }
            hit() {
                if (this.shield > 1) {
                    this.shield -= 1;
                } else {
                    this.destroy();
                }
            }
            destroy() {
                if (!this.isDestroyed) {
                    this.isDestroyed = true;
                    aliens = aliens.filter((a) => a !== this);
                    createParticleExplosion(this.x + this.width / 2, this.y + this.height / 2, 20);
                }
            }
        }

        // ============================
        // BOSS CLASS WITH SHIELD & HEALTH BARS
        // (Modified to use multiple attack types instead of always firing a laser)
        // ============================
        class Boss {
            constructor() {
                this.image = new Image();
                this.image.src = currentEnemySprites.boss || window.gameImages.boss.src;
                switch (level) {
                    case 1:
                        this.width = 200;
                        this.height = 200;
                        this.health = 40;
                        this.speedX = 80;
                        this.verticalSpeedDown = 100;
                        this.verticalSpeedUp = 100;
                        this.shotsPerInterval = 3;
                        this.shootInterval = 1;
                        break;
                    case 2:
                        this.width = 200;
                        this.height = 200;
                        this.health = 100;
                        this.speedX = 105;
                        this.verticalSpeedDown = 105;
                        this.verticalSpeedUp = 105;
                        this.shotsPerInterval = 4;
                        this.shootInterval = 1;
                        break;
                    case 3:
                        this.width = 200;
                        this.height = 200;
                        this.health = 80;
                        this.speedX = 118;
                        this.verticalSpeedDown = 118;
                        this.verticalSpeedUp = 118;
                        this.shotsPerInterval = 5;
                        this.shootInterval = 0.9;
                        break;
                    case 4:
                        this.width = 250;
                        this.height = 250;
                        this.health = 40;
                        this.speedX = 110;
                        this.verticalSpeedDown = 110;
                        this.verticalSpeedUp = 110;
                        this.shotsPerInterval = 4;
                        this.shootInterval = 0.9;
                        break;
                    case 5:
                        this.width = 250;
                        this.height = 250;
                        this.health = 40;
                        this.speedX = 120;
                        this.verticalSpeedDown = 120;
                        this.verticalSpeedUp = 120;
                        this.shotsPerInterval = 5;
                        this.shootInterval = 0.8;
                        break;
                    case 6:
                        this.width = 270;
                        this.height = 270;
                        this.health = 35;
                        this.speedX = 125;
                        this.verticalSpeedDown = 125;
                        this.verticalSpeedUp = 125;
                        this.shotsPerInterval = 5;
                        this.shootInterval = 0.8;
                        break;
                    case 7:
                        this.width = 270;
                        this.height = 270;
                        this.health = 40;
                        this.speedX = 130;
                        this.verticalSpeedDown = 130;
                        this.verticalSpeedUp = 130;
                        this.shotsPerInterval = 6;
                        this.shootInterval = 0.75;
                        break;
                    case 8:
                        this.width = 300;
                        this.height = 300;
                        this.health = 45;
                        this.speedX = 135;
                        this.verticalSpeedDown = 135;
                        this.verticalSpeedUp = 135;
                        this.shotsPerInterval = 6;
                        this.shootInterval = 0.75;
                        break;
                    case 9:
                        this.width = 300;
                        this.height = 300;
                        this.health = 50;
                        this.speedX = 140;
                        this.verticalSpeedDown = 140;
                        this.verticalSpeedUp = 140;
                        this.shotsPerInterval = 7;
                        this.shootInterval = 0.7;
                        break;
                    case 10:
                        this.width = 320;
                        this.height = 320;
                        this.health = 55;
                        this.speedX = 145;
                        this.verticalSpeedDown = 145;
                        this.verticalSpeedUp = 145;
                        this.shotsPerInterval = 7;
                        this.shootInterval = 0.7;
                        break;
                    case 11:
                        this.width = 330;
                        this.height = 330;
                        this.health = 60;
                        this.speedX = 150;
                        this.verticalSpeedDown = 150;
                        this.verticalSpeedUp = 150;
                        this.shotsPerInterval = 8;
                        this.shootInterval = 2;
                        break;
                    default:
                        this.width = 250;
                        this.height = 100;
                        this.health = 20;
                        this.speedX = 80;
                        this.verticalSpeedDown = 100;
                        this.verticalSpeedUp = 100;
                        this.shotsPerInterval = 3;
                        this.shootInterval = 1;
                        break;
                }

                this.x = canvas.width / 2 - this.width / 2;
                this.y = -this.height;
                this.movingDown = true;
                this.shootCooldown = 0;
                this.shootCounter = 0;
                // A color for bullets
                this.bulletColor = level === 2 ? 'blue' : level === 3 ? 'purple' : 'red';
                // Shield stats for boss:
                this.shieldHP = 30;
                this.maxShieldHP = 50;
                this.shieldActive = true;
                // Flag to track if the laser beam is active
                this.laserBeamActive = false;
            }

            // Attack methods
            attackLaser() {
                if (!this.laserBeamActive) {
                    bossLaserBeams.push(new BossLaserBeam(this));
                    this.laserBeamActive = true;
                    setTimeout(() => {
                        this.laserBeamActive = false;
                    }, 1000);
                }
            }

            attackSpread() {
                const centerX = this.x + this.width / 2;
                const bottomY = this.y + this.height;
                const bulletCount = 5;
                const spreadDegrees = 60;
                const baseAngle = Math.PI / 2;
                const spread = (spreadDegrees * Math.PI) / 180;
                const angleStep = bulletCount > 1 ? spread / (bulletCount - 1) : 0;
                for (let i = 0; i < bulletCount; i++) {
                    const angle = baseAngle - spread / 2 + i * angleStep;
                    const dx = Math.cos(angle) * 300;
                    const dy = Math.sin(angle) * 300;
                    bossBullets.push(
                        new BossBullet(centerX, bottomY, dx, dy, this.bulletColor)
                    );
                }
            }

            attackCircle() {
                const centerX = this.x + this.width / 2;
                const centerY = this.y + this.height / 2;
                const bulletCount = 12;
                for (let i = 0; i < bulletCount; i++) {
                    const angle = (i * (2 * Math.PI)) / bulletCount;
                    const speed = 250;
                    const dx = Math.cos(angle) * speed;
                    const dy = Math.sin(angle) * speed;
                    bossBullets.push(
                        new BossBullet(centerX, centerY, dx, dy, this.bulletColor)
                    );
                }
            }

            attackBurst() {
                const centerX = this.x + this.width / 2;
                const bottomY = this.y + this.height;
                const bulletCount = 3;
                const bulletSpacing = 20;
                for (let i = 0; i < bulletCount; i++) {
                    const offset = (i - 1) * bulletSpacing;
                    bossBullets.push(
                        new BossBullet(centerX + offset, bottomY, 0, 500, this.bulletColor)
                    );
                }
            }

            update(deltaTime) {
                const targetY = canvas.height * 0.4;
                if (this.movingDown) {
                    this.y += this.verticalSpeedDown * deltaTime;
                    if (this.y >= targetY) {
                        this.movingDown = false;
                    }
                } else {
                    this.y -= this.verticalSpeedUp * deltaTime;
                    if (this.y <= 0) {
                        this.y = 0;
                        this.movingDown = true;
                    }
                }
                this.x += this.speedX * deltaTime;
                if (this.x < 0) {
                    this.x = 0;
                    this.speedX *= -1;
                } else if (this.x > canvas.width - this.width) {
                    this.x = canvas.width - this.width;
                    this.speedX *= -1;
                }
                if (this.shootCooldown > 0) {
                    this.shootCooldown -= deltaTime;
                }
                if (this.shootCooldown <= 0) {
                    // Randomly choose one of the four attack types
                    const attackChoice = Math.floor(Math.random() * 4);
                    if (attackChoice === 0) {
                        this.attackLaser();
                    } else if (attackChoice === 1) {
                        this.attackSpread();
                    } else if (attackChoice === 2) {
                        this.attackCircle();
                    } else {
                        this.attackBurst();
                    }
                    this.shootCooldown = this.shootInterval;
                }
            }

            draw() {
                stopSpawning();
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
                // Draw shield circle if shield is active
                if (this.shieldActive) {
                    this.drawShieldCircle(ctx);
                }
            }

            drawShieldCircle(ctx) {
                ctx.save();
                ctx.globalAlpha = 0.6;
                ctx.globalCompositeOperation = 'lighter';
                const shieldRadius = Math.max(this.width, this.height) * 0.8;
                const centerX = this.x + this.width / 2;
                const centerY = this.y + this.height / 2;
                const gradient = ctx.createRadialGradient(
                    centerX, centerY, shieldRadius * 0.4,
                    centerX, centerY, shieldRadius
                );
                gradient.addColorStop(0, 'rgba(0, 255, 255, 1)');
                gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, shieldRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            hit() {
                createParticleExplosion(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    30
                );
                if (this.shieldActive) {
                    this.shieldHP--;
                    if (this.shieldHP <= 0) {
                        this.shieldActive = false;
                    }
                    return;
                }
                this.health -= 1;
                if (this.health <= 0) {
                    this.destroy();
                }
            }

            destroy() {
                level += 1;
                loadLevelConfig(level);
                resetDifficulty();
                restartSpawning();
                bossSpawned = false;
                boss = null;
                createParticleExplosion(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    30
                );
            }
        }

        // ============================
        // COIN (ONAI) CLASS
        // ============================
        class ONAI {
            constructor(x, y) {
                this.image = window.gameImages.onai;
                this.width = 30;
                this.height = 30;
                this.x = x;
                this.y = y;
                this.vx = randomFloat(5, 80);
                this.vy = randomFloat(1, 120);
            }
            draw() {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
            update(deltaTime) {
                this.x += this.vx * deltaTime;
                this.y += this.vy * deltaTime;
                if (this.x < 0) {
                    this.x = 0;
                    this.vx = -this.vx;
                }
                if (this.x + this.width > canvas.width) {
                    this.x = canvas.width - this.width;
                    this.vx = -this.vx;
                }
                if (this.y < 0) {
                    this.y = 0;
                    this.vy = -this.vy;
                }
                if (this.y + this.height > canvas.height) {
                    this.y = canvas.height - this.height;
                    this.vy = -this.vy;
                }
            }
            destroy() {
                onais = onais.filter((o) => o !== this);
            }
        }

        class Life {
            constructor() {
                this.image = window.gameImages.life;
                this.width = 50;
                this.height = 50;
                this.x = Math.random() * (canvas.width - this.width);
                this.y = -this.height;
                this.speed = 150;
            }
            draw() {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
            update(deltaTime) {
                this.speed += GRAVITY * deltaTime;
                this.y += this.speed * deltaTime;
                if (this.y > canvas.height) this.destroy();
            }
            destroy() {
                lifePickups = lifePickups.filter((l) => l !== this);
            }
        }

        // ASTEROID CLASS (2 hits to kill)
        class Asteroid {
            constructor(canvasWidth, canvasHeight, images, createExplosion, debrisArray) {
                this.image = images.asteroid;
                this.width = 60;
                this.height = 60;
                this.x = Math.random() * (canvasWidth - this.width);
                this.y = -this.height;
                this.speedY = Math.random() * 50 + 70;
                this.speedX = Math.random() * 100 - 50;
                this.health = 2;
                this.isDestroyed = false;
                this.createExplosion = createExplosion;
                this.debrisArray = debrisArray;
            }
            update(deltaTime, canvasWidth, canvasHeight) {
                this.y += this.speedY * deltaTime;
                this.x += this.speedX * deltaTime;
                if (this.x <= 0 || this.x >= canvasWidth - this.width) {
                    this.speedX = -this.speedX;
                }
                if (this.y > canvasHeight) {
                    this.destroy();
                }
                if (Math.random() < 0.3) {
                    let angle = Math.atan2(this.speedY, this.speedX);
                    let spawnX = this.x + this.width / 2 - Math.cos(angle) * (this.width / 2);
                    let spawnY = this.y + this.height / 2 - Math.sin(angle) * (this.height / 2);
                    dustParticles.push(new DustParticle(spawnX, spawnY));
                }
            }
            draw(ctx) {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
            hit() {
                this.health--;
                if (this.health <= 0) {
                    this.destroy();
                }
            }
            destroy() {
                if (this.isDestroyed) return;
                this.isDestroyed = true;
                createParticleExplosion(this.x + this.width / 2, this.y + this.height / 2, 20);
                const numCoins = 1;
                for (let i = 0; i < numCoins; i++) {
                    const offsetX = i === 0 ? -10 : 40;
                    onais.push(new ONAI(this.x + this.width / 2 + offsetX, this.y + this.height / 2));
                }
                asteroids = asteroids.filter((asteroid) => asteroid !== this);
                for (let i = 0; i < 4; i++) {
                    this.debrisArray.push(
                        new AsteroidDebris(this.x + this.width / 2, this.y + this.height / 2)
                    );
                }
            }
        }

        const resetCanvasContext = () => {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.font = '20px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = 'white';
        };

        const drawText = (text, x, y, size = 20, color = 'white') => {
            resetCanvasContext();
            ctx.fillStyle = color;
            ctx.font = `${size}px Arial`;
            ctx.fillText(text, x, y);
        };

        const drawShieldBar = () => {
            const barWidth = 100;
            const barHeight = 20;
            const x = canvas.width / 2 - barWidth / 2;
            const y = 70;
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText('Shield Remaining', x - 25, y - 10);
            ctx.fillStyle = 'grey';
            ctx.fillRect(x, y, barWidth, barHeight);
            const shieldWidth = (shield / maxShield) * barWidth;
            ctx.fillStyle = 'green';
            ctx.fillRect(x, y, shieldWidth, barHeight);
        };

        const drawRocketPowerUp = () => {
            const x = canvas.width - 45;
            const y = canvas.height - 45;
            const width = 25;
            const height = 25;
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            const radius = Math.max(width, height) / 2 + 12;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.closePath();
            ctx.drawImage(rocketPowerUpImage, x, y, width, height);
            drawText(`x${rocketUses}`, x + 6, y - 20, 15, 'white');
        };

        function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }

        // const drawExitButton = () => {
        //   const x = 20;
        //   const y = canvas.height - 45;
        //   const width = 25;
        //   const height = 25;
        //   const centerX = x + width / 2;
        //   const centerY = y + height / 2;
        //   const radius = Math.max(width, height) / 2 + 12;
        //   ctx.beginPath();
        //   ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        //   ctx.strokeStyle = 'green';
        //   ctx.lineWidth = 4;
        //   ctx.stroke();
        //   ctx.closePath();
        //   ctx.drawImage(saveAndExitImage, x, y, width, height);
        // };

        //FOR save and exit
        // Add this function (similar to drawRocketPowerUp) inside your useEffect (or near your other draw functions):
        const drawExitButton = () => {
            // Define button dimensions and position:
            // (for example, 20px from the left and 20px from the bottom)
            // const btnWidth = 80;
            // const btnHeight = 40;
            // const x = 20;
            // const y = canvas.height - btnHeight - 20;
            // const centerX = x + btnWidth / 2;
            // const centerY = y + btnHeight / 2;

            // // Draw a rounded rectangle button (you can use your drawRoundedRect helper)
            // drawRoundedRect(ctx, x, y, btnWidth, btnHeight, 10, "#f00"); // red background, radius 10

            // // Draw the text "Exit"
            // ctx.font = "18px Arial";
            // ctx.fillStyle = "white";
            // ctx.textAlign = "center";
            // ctx.textBaseline = "middle";
            // ctx.fillText("Exit", centerX, centerY);

            // // Return the bounds for later click detection
            // return { x, y, width: btnWidth, height: btnHeight };
            const x = 20;
            const y = canvas.height - 45;
            const width = 25;
            const height = 25;
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            const radius = Math.max(width, height) / 2 + 12;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = "green";
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.closePath();

            const rocketX = x;
            const rocketY = y;

            ctx.drawImage(saveAndExitImage, rocketX, rocketY, width, height);

            // drawText(`x${rocketUses}`, x + 6, y - 20, 15, "white");
        };

        // Draw the pause screen
        function drawPauseScreen() {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            if (isAdLoading) {
                ctx.fillText('Loading Ad...', canvas.width / 2, canvas.height / 2);
                return;
            }
            const message1 = 'Get a life +1❤️ to continue your game';
            const message2 = 'by watching an Ad!';
            const message3 = 'Or to start again click Quit';
            const message1Y = canvas.height / 2 - 140;
            const message2Y = message1Y + 30;
            const message3Y = message2Y + 30;
            ctx.fillText(message1, canvas.width / 2, message1Y);
            const heartIndex = message1.indexOf('❤️');
            if (heartIndex !== -1) {
                const textBeforeHeart = message1.substring(0, heartIndex);
                const textWidthBeforeHeart = ctx.measureText(textBeforeHeart).width;
                const startX = (canvas.width - ctx.measureText(message1).width) / 2;
                const heartX = startX + textWidthBeforeHeart;
                const heartY = message1Y - 15;
                const lifeImage = window.gameImages.life;
                const imageWidth = 15;
                const imageHeight = 15;
                ctx.drawImage(lifeImage, heartX, heartY, imageWidth, imageHeight);
            }
            ctx.fillText(message2, canvas.width / 2, message2Y);
            ctx.fillText(message3, canvas.width / 2, message3Y);
            const buttonWidth = 200;
            const buttonHeight = 40;
            const buttonX = canvas.width / 2 - buttonWidth / 2;
            const buttonY1 = canvas.height / 2 - 30;
            const buttonY2 = buttonY1 + buttonHeight + 20;
            const buttonColor = '#CBFC01';
            const quitButtonColor = 'red';
            const buttonTextColor = 'black';
            const borderRadius = 20;
            function drawRoundedRect(ctx, x, y, w, h, r, fill) {
                ctx.beginPath();
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + w - r, y);
                ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                ctx.lineTo(x + w, y + h - r);
                ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                ctx.lineTo(x + r, y + h);
                ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
                ctx.closePath();
                ctx.fillStyle = fill;
                ctx.fill();
            }
            drawRoundedRect(ctx, buttonX, buttonY1, buttonWidth, buttonHeight, borderRadius, buttonColor);
            ctx.fillStyle = buttonTextColor;
            ctx.fillText('Watch Ad', canvas.width / 2, buttonY1 + buttonHeight / 2 + 6);
            drawRoundedRect(ctx, buttonX, buttonY2, buttonWidth, buttonHeight, borderRadius, quitButtonColor);
            ctx.fillStyle = buttonTextColor;
            ctx.fillText('Quit', canvas.width / 2, buttonY2 + buttonHeight / 2 + 6);
        }

        const pauseOverlayAndLevelTransition = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = '80px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText(`Level ${levelTransitionRef.current}`, canvas.width / 2, canvas.height / 2);
            ctx.font = '30px Arial';
            ctx.fillText('Tap to continue', canvas.width / 2, canvas.height / 2 + 80);
        };

        const pauseGame = () => {
            setIsPaused(true);
            activeIntervals.forEach(clearInterval);
            activeIntervals = [];
            activeTimeouts.forEach(clearTimeout);
            activeTimeouts = [];
            pausedAtTime = performance.now();
            cancelAnimationFrame(animationFrame);
            if (boss) {
                storedBossX = boss.x;
                storedBossY = boss.y;
            }
        };

        const resumeGame = () => {
            setIsPaused(false);
            const now = performance.now();
            lastTime += now - pausedAtTime;
            pausedAtTime = 0;
            startSpawning();
            requestAnimationFrame(gameLoop);
        };

        const resumeWithOneLife = () => {
            lives = 1;
            gameOverTriggered = false;
            if (boss) {
                boss.x = storedBossX !== null ? storedBossX : boss.x;
                boss.y = storedBossY !== null ? storedBossY : boss.y;
            }
            showPauseScreen(false);
            resumeGame();
        };

        const handleWatchAd = () => {
            if (adController) {
                setIsAdLoading(true);
                adController
                    .show()
                    .then((result) => {
                        setIsAdLoading(false);
                        if (result.done) {
                            resumeWithOneLife();
                        } else {
                            toast.error('Ad was not fully watched. No reward granted.');
                        }
                    })
                    .catch((error) => {
                        setIsAdLoading(false);
                        console.error('Error showing ad:', error);
                        alert('An error occurred while showing the ad.');
                    });
            } else {
                toast.error('Ad service is not ready yet. Please try again later.');
            }
        };

        const handleQuit = () => {
            showPauseScreen(false);
        };

        const handlePauseScreenClick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            const buttonWidth = 200;
            const buttonHeight = 40;
            const buttonX = canvas.width / 2 - buttonWidth / 2;
            const buttonY1 = canvas.height / 2 - 30;
            const buttonY2 = buttonY1 + buttonHeight + 20;
            if (
                x >= buttonX &&
                x <= buttonX + buttonWidth &&
                y >= buttonY1 &&
                y <= buttonY1 + buttonHeight
            ) {
                handleWatchAd();
            }
            if (
                x >= buttonX &&
                x <= buttonX + buttonWidth &&
                y >= buttonY2 &&
                y <= buttonY2 + buttonHeight
            ) {
                onGameOver({ score, onaiScore });
                handleQuit();
            }
        };

        function showPauseScreen(show) {
            if (show) {
                drawPauseScreen();
                canvas.addEventListener('click', handlePauseScreenClick);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.removeEventListener('click', handlePauseScreenClick);
            }
        }

        // SINGLE definition of fireRocket (duplicate removed)
        const fireRocket = () => {
            if (rocketUses > 0) {
                rocketUses -= 1;
                let rocketX = rocket.x + rocket.width / 2 - 5;
                let rocketY = rocket.y;
                firedRockets.push(new FiredRocket(rocketX, rocketY));
            }
        };

        const destroyAllAliens = () => {
            aliens.forEach((alien) => alien.destroy());
            if (boss) {
                boss.destroy();
            }
        };

        const drawLaserPowerUp = () => {
            const x = 20;
            const y = canvas.height - 45;
            const width = 25;
            const height = 25;
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            const radius = Math.max(width, height) / 2 + 12;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.closePath();
            ctx.drawImage(laserPowerUpImage, x, y, width, height);
            drawText(`x${laserUses}`, x + 6, y - 20, 15, 'white');
        };

        const handleCanvasClick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            const buttonX = canvas.width - 45;
            const buttonY = canvas.height - 45;
            const buttonWidth = 25;
            const buttonHeight = 25;
            if (
                x >= buttonX &&
                x <= buttonX + buttonWidth &&
                y >= buttonY &&
                y <= buttonY + buttonHeight
            ) {
                fireRocket();
                return;
            }
            if (levelTransitionRef.current !== null) {
                setLevelTransition(null);
                levelTransitionRef.current = null;
                resumeGame();
                return;
            }

            const exitButtonX = 20;
            const exitButtonY = canvas.height - 45;
            const exitButtonWidth = 25;
            const exitButtonHeight = 25;

            if (
                x >= exitButtonX &&
                x <= exitButtonX + exitButtonWidth &&
                y >= exitButtonY &&
                y <= exitButtonY + exitButtonHeight
            ) {
                onGameOver({ score, onaiScore });
                handleQuit();
                return; // Prevent further click logic from triggering
            }
        };

        function spawnTonCollectible() {
            if (Math.random() < currentDifficulty.tonSpawnChance) {
                const x = Math.random() * (canvas.width - 30);
                const y = -30;
                tonCollectibles.push(new TonCollectible(x, y));
            }
            setRandomTonDrop();
        }

        function setRandomTonDrop() {
            const randomInterval = randomFloat(20000, 50000);
            const timeoutId = setTimeout(() => {
                spawnTonCollectible();
            }, randomInterval);
            activeTimeouts.push(timeoutId);
        }

        // NEW: Rocket Power‑Up collectible spawn functions
        function spawnRocketCollectible() {
            const x = Math.random() * (canvas.width - 30);
            const y = -30;
            rocketCollectibles.push(new RocketCollectible(x, y));
            setRandomRocketCollectible();
        }

        function setRandomRocketCollectible() {
            const randomInterval = randomFloat(60000, 120000);
            const timeoutId = setTimeout(() => {
                spawnRocketCollectible();
            }, randomInterval);
            activeTimeouts.push(timeoutId);
        }

        // NEW: Tractor Beam pickup spawn functions
        function spawnTractorBeamCollectibleWrapper() {
            spawnTractorBeamCollectible(canvas);
        }
        function setRandomTractorBeam() {
            const randomInterval = randomFloat(60000, 120000);
            const timeoutId = setTimeout(() => {
                spawnTractorBeamCollectible(canvas);
            }, randomInterval);
            activeTimeouts.push(timeoutId);
        }

        // NEW: Shield pickup spawn functions
        function spawnShieldCollectible() {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const x = Math.random() * (canvas.width - 30);
            const y = -30;
            shieldCollectibles.push(new ShieldCollectible(x, y));
            setRandomShieldCollectible();
        }
        function setRandomShieldCollectible() {
            const randomInterval = randomFloat(20000, 300000);
            const timeoutId = setTimeout(() => {
                spawnShieldCollectible();
            }, randomInterval);
            activeTimeouts.push(timeoutId);
        }

        // Spawning logic
        const startSpawning = () => {
            activeIntervals.push(
                setInterval(spawnAlien, currentDifficulty.alienIntervalTime)
            );
            spawnAsteroidsPeriodically();
            setRandomLaserDrop();
            setRandomTonDrop();
            setRandomRocketCollectible();
            setRandomTractorBeam();
            setRandomShieldCollectible();
        };

        function spawnAlien() {
            let numberOfAliens = 1;
            if (score >= 150) {
                numberOfAliens = randomInt(1, 5);
            } else if (score >= 120) {
                numberOfAliens = randomInt(1, 4);
            } else if (score >= 80) {
                numberOfAliens = randomInt(1, 3);
            } else if (score >= 45) {
                numberOfAliens = Math.random() < 0.5 ? 1 : 2;
            }
            for (let i = 0; i < numberOfAliens; i++) {
                if (aliens.length < currentDifficulty.alienSpawnLimit) {
                    aliens.push(new Alien());
                }
            }
        }

        function spawnAsteroidFn() {
            asteroids.push(
                new Asteroid(
                    canvas.width,
                    canvas.height,
                    window.gameImages,
                    createParticleExplosion,
                    debris
                )
            );
        }

        function spawnAsteroidsPeriodically() {
            const spawnInterval = setInterval(() => {
                spawnAsteroidFn();
            }, 1000);
            activeIntervals.push(spawnInterval);
        }

        const spawnLife = () => {
            const lifeSpawnInterval = 30000; // 30 seconds
            if (lifePickups.length < 1) {
                lifePickups.push(new Life());
            }
            const timeoutId = setTimeout(spawnLife, lifeSpawnInterval);
            activeTimeouts.push(timeoutId);
        };


        const setRandomLifeSpawn = () => {
            const timeoutId = setTimeout(spawnLife, lifeSpawnInterval);
            activeTimeouts.push(timeoutId);
        };


        class Laser {
            constructor(x, y) {
                this.image = window.gameImages.laser;
                this.width = 50;
                this.height = 50;
                this.x = x;
                this.y = y;
                this.speed = 120;
            }
            draw() {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
            update(deltaTime) {
                this.y += this.speed * deltaTime;
                if (this.y > canvas.height) this.destroy();
            }
            destroy() {
                lasers = lasers.filter((l) => l !== this);
            }
        }

        const spawnLaser = (x, y) => {
            lasers.push(new Laser(x, y));
        };

        const setRandomLaserDrop = () => {
            const randomInterval = randomFloat(15000, 50000);
            const timeoutId = setTimeout(() => {
                if (!laserCooldown && aliens.length > 0) {
                    const randomAlien = aliens[Math.floor(Math.random() * aliens.length)];
                    spawnLaser(randomAlien.x, randomAlien.y);
                }
                setRandomLaserDrop();
            }, randomInterval);
            activeTimeouts.push(timeoutId);
        };

        const handleKeyDown = (e) => {
            if (e.key === 'p') {
                setIsPaused((prev) => {
                    if (prev) resumeGame();
                    else pauseGame();
                    return !prev;
                });
            }
            keys[e.key] = true;
        };

        const handleKeyUp = (e) => {
            delete keys[e.key];
        };

        const handleTouchStart = (e) => {
            rocket.touchX = e.touches[0].clientX;
            rocket.touchY = e.touches[0].clientY;
        };

        const handleTouchMove = (e) => {
            rocket.touchX = e.touches[0].clientX;
            rocket.touchY = e.touches[0].clientY;
        };

        const handleTouchEnd = () => {
            rocket.touchX = null;
            rocket.touchY = null;
        };

        const activateAutoShoot = () => {
            autoShoot = true;
            blueAutoShoot = false;
            laserCooldown = true;
            clearTimeout(autoShootTimeout);
            autoShootTimeout = setTimeout(() => {
                autoShoot = false;
                setTimeout(() => {
                    laserCooldown = false;
                }, 40000);
            }, 10000);
        };

        const activateBlueAutoShoot = () => {
            blueAutoShoot = true;
            clearTimeout(autoShootTimeout);
            autoShootTimeout = setTimeout(() => {
                blueAutoShoot = false;
            }, 5000);
        };

        const restartSpawning = () => {
            activeIntervals.forEach(clearInterval);
            activeIntervals = [];
            startSpawning();
        };

        const stopSpawning = () => {
            activeIntervals.forEach(clearInterval);
            activeIntervals = [];
        };

        rocket = new Rocket();
        const autoShootInterval = setInterval(() => {
            shoot();
        }, 200);
        startSpawning();
        setRandomLifeSpawn();

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchmove', handleTouchMove);
        canvas.addEventListener('touchend', handleTouchEnd);
        canvas.addEventListener('click', handleCanvasClick);

        let lastTime = performance.now();
        let pausedAtTime = 0;

        // MAIN GAME LOOP
        const gameLoop = (time) => {
            if (isPaused && levelTransition === null) {
                cancelAnimationFrame(animationFrame);
                return;
            }
            const deltaTime = (time - lastTime) / 1000;
            lastTime = time;

            updateStarfield(canvas.width, canvas.height);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            applyCameraShake(ctx);

            ctx.fillStyle = currentBackgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (!window.extraImagesCache) {
                window.extraImagesCache = {};
            }
            currentStarfieldExtras.forEach((elem) => {
                let extraImg;
                if (window.extraImagesCache[elem.image]) {
                    extraImg = window.extraImagesCache[elem.image];
                } else {
                    extraImg = new Image();
                    extraImg.src = elem.image;
                    window.extraImagesCache[elem.image] = extraImg;
                }
                const offsetY = elem.parallaxSpeed
                    ? (frameCount * elem.parallaxSpeed) % (canvas.height + elem.height) - elem.height
                    : elem.y;
                ctx.save();
                ctx.globalAlpha = typeof elem.opacity !== 'undefined' ? elem.opacity : 1;
                ctx.drawImage(extraImg, elem.x, offsetY, elem.width, elem.height);
                ctx.restore();
            });

            drawStarfield(ctx);

            dustParticles.forEach((particle) => {
                particle.update(deltaTime);
                particle.draw(ctx);
            });
            dustParticles = dustParticles.filter((p) => !p.isDead());

            if (levelTransition === null) {
                rocket.update(deltaTime);
                rocket.draw();

                // Check collision for shield pickups
                for (let i = shieldCollectibles.length - 1; i >= 0; i--) {
                    const shieldItem = shieldCollectibles[i];
                    if (
                        rocket &&
                        shieldItem &&
                        rocket.x < shieldItem.x + shieldItem.width &&
                        rocket.x + rocket.width > shieldItem.x &&
                        rocket.y < shieldItem.y + shieldItem.height &&
                        rocket.y + rocket.height > shieldItem.y
                    ) {
                        // Activate the shield (here, we're setting activeShield to 5 hits)
                        rocket.activeShield = 5;
                        // Remove the shield pickup from the array
                        shieldCollectibles.splice(i, 1);
                    }
                }


                // Update & Draw Asteroids
                asteroids.forEach((a) => {
                    a.update(1 / FPS, canvas.width, canvas.height);
                    a.draw(ctx);
                });

                // Update & Draw Bullets
                bullets.forEach((b) => {
                    b.update(deltaTime);
                    b.draw(ctx);
                });

                // Update & Draw Aliens
                aliens.forEach((a) => {
                    a.update(deltaTime);
                    a.draw(ctx);
                });

                // Update & Draw Alien Bullets
                alienBullets.forEach((b) => {
                    b.update(deltaTime);
                    b.draw(ctx);
                });

                // Update & Draw Boss Bullets
                bossBullets.forEach((b) => {
                    b.update(deltaTime);
                    b.draw(ctx);
                });

                // Update & Draw Onai
                onais.forEach((o) => {
                    o.update(deltaTime);
                    o.draw(ctx);
                });

                // Update & Draw Laser Icons
                lasers.forEach((l) => {
                    l.update(deltaTime);
                    l.draw(ctx);
                });

                // Update & Draw Life Pickups
                lifePickups.forEach((life) => {
                    life.update(deltaTime);
                    life.draw(ctx);
                });

                // Update & Draw Fired Rockets (nuke)
                firedRockets.forEach((r) => {
                    r.update(deltaTime);
                    r.draw(ctx);
                });

                // Update & Draw Rocket Power‑Up Collectibles
                rocketCollectibles.forEach((rocketItem) => {
                    rocketItem.update(deltaTime, canvas.width, canvas.height);
                    rocketItem.draw(ctx);
                });

                // Update & Draw Tractor Beam Pickups
                tractorBeamCollectibles.forEach((item) => {
                    item.update(deltaTime, canvas.width, canvas.height);
                    item.draw(ctx);
                });

                // Update & Draw Shield Pickups
                shieldCollectibles.forEach((shieldItem) => {
                    shieldItem.update(deltaTime, canvas.width, canvas.height);
                    shieldItem.draw(ctx);
                });

                // Particle Explosions
                particleExplosions.forEach((pe) => pe.update(deltaTime));
                particleExplosions.forEach((pe) => pe.draw(ctx));
                particleExplosions = particleExplosions.filter((pe) => !pe.done);

                checkForBossSpawn();
                if (boss) {
                    boss.update(deltaTime);
                    boss.draw(ctx);
                    stopSpawning();
                }

                // Update & Draw TON Collectibles
                tonCollectibles.forEach((ton) => {
                    ton.update(deltaTime, canvas.width, canvas.height);
                    ton.draw(ctx);
                });

                // NEW: Tractor Beam Effect
                if (tractorBeamActive) {
                    onais.forEach((coin) => {
                        const targetX = rocket.x + rocket.width / 30;
                        const targetY = rocket.y + rocket.height / 30;
                        const coinCenterX = coin.x + coin.width / 2;
                        const coinCenterY = coin.y + coin.height / 2;
                        const diffX = targetX - coinCenterX;
                        const diffY = targetY - coinCenterY;
                        const pullSpeed = 0.02;
                        coin.x += diffX * pullSpeed;
                        coin.y += diffY * pullSpeed;
                        if (Math.abs(diffX) < 5 && Math.abs(diffY) < 5) {
                            tonCount += TON_VALUE;
                            onais = onais.filter((o) => o !== coin);
                        }
                    });
                    ctx.save();
                    const time = Date.now() * 0.005;
                    const pulse = Math.abs(Math.sin(time));
                    ctx.strokeStyle = `rgba(0, 128, 0, ${0.4 + pulse * 0.3})`;
                    ctx.lineWidth = 3 + pulse * 3;
                    ctx.shadowBlur = 10 + pulse * 20;
                    const beamCenterX = rocket.x + rocket.width / 2;
                    const beamStartY = rocket.y + rocket.height / 2;
                    const beamEndY = 0;
                    ctx.beginPath();
                    ctx.moveTo(beamCenterX, beamStartY);
                    ctx.lineTo(beamCenterX, beamEndY);
                    ctx.stroke();
                    ctx.restore();
                }

                // NEW: Tractor Beam Pickup Collision
                for (let i = tractorBeamCollectibles.length - 1; i >= 0; i--) {
                    let tractorItem = tractorBeamCollectibles[i];
                    if (
                        rocket &&
                        tractorItem &&
                        rocket.x < tractorItem.x + tractorItem.width &&
                        rocket.x + rocket.width > tractorItem.x &&
                        rocket.y < tractorItem.y + tractorItem.height &&
                        rocket.y + rocket.height > tractorItem.y
                    ) {
                        activateTractorBeam();
                        tractorBeamCollectibles.splice(i, 1);
                    }
                }

                const isColliding = (a, b) => {
                    return (
                        a &&
                        b &&
                        a.x < b.x + b.width &&
                        a.x + a.width > b.x &&
                        a.y < b.y + b.height &&
                        a.y + a.height > b.y
                    );
                };

                // Asteroids <-> Bullets & Rocket
                asteroids.forEach((asteroid) => {
                    bullets.forEach((bullet) => {
                        if (isColliding(bullet, asteroid)) {
                            bullet.destroy();
                            asteroid.hit();
                        }
                    });
                    if (isColliding(rocket, asteroid)) {
                        if (rocket.activeShield > 0) {
                            rocket.activeShield--;
                            showShieldImpact(rocket.x, rocket.y);
                        } else if (shield > 0) {
                            shield--;
                        } else {
                            lives--;
                            shakeTime = 10;
                        }
                        createParticleExplosion(
                            rocket.x + rocket.width / 2,
                            rocket.y + rocket.height / 2,
                            20
                        );
                        asteroid.destroy();
                    }
                });

                // Aliens <-> Bullets & Rocket
                aliens.forEach((alien) => {
                    if (isColliding(rocket, alien)) {
                        if (rocket.activeShield > 0) {
                            rocket.activeShield--;
                            showShieldImpact(rocket.x, rocket.y);
                        } else if (shield > 0) {
                            shield--;
                        } else {
                            lives--;
                            shakeTime = 10;
                        }
                        createParticleExplosion(
                            rocket.x + rocket.width / 2,
                            rocket.y + rocket.height / 2,
                            20
                        );
                        alien.destroy();
                    }
                    bullets.forEach((bullet) => {
                        if (isColliding(bullet, alien)) {
                            alien.hit();
                            bullet.destroy();
                        }
                    });
                });

                // Onai <-> Rocket
                //here
                for (let i = onais.length - 1; i >= 0; i--) {
                    if (isColliding(rocket, onais[i])) {
                        if (isTimeBetween9And10PM() || isTimeBetween11And12PM()) {
                            onaiScore += 2;
                            score += 2;
                        } else {
                            onaiScore += 1;
                            score += 1;
                        }
                        if (score % 20 === 0) {
                            increaseDifficulty();
                        }
                        onais.splice(i, 1);
                    }
                }

                // Laser Icon <-> Rocket
                lasers.forEach((laser) => {
                    if (isColliding(rocket, laser)) {
                        activateAutoShoot();
                        laser.destroy();
                    }
                });

                // Life Pickup <-> Rocket
                lifePickups.forEach((life) => {
                    if (isColliding(rocket, life)) {
                        lives += 1;
                        life.destroy();
                    }
                });

                // Alien Bullets <-> Rocket
                alienBullets.forEach((bullet) => {
                    if (isColliding(rocket, bullet)) {
                        if (rocket.activeShield > 0) {
                            rocket.activeShield--;
                            showShieldImpact(rocket.x, rocket.y);
                        } else if (shield > 0) {
                            shield -= 1;
                        } else {
                            lives -= 1;
                            shakeTime = 10;
                        }
                        createParticleExplosion(
                            rocket.x + rocket.width / 2,
                            rocket.y + rocket.height / 2,
                            20
                        );
                        bullet.destroy();
                    }
                });

                // Boss Bullets <-> Rocket
                bossBullets.forEach((bullet) => {
                    if (isColliding(rocket, bullet)) {
                        if (rocket.activeShield > 0) {
                            rocket.activeShield--;
                            showShieldImpact(rocket.x + rocket.width / 2, rocket.y + rocket.height / 2);
                        } else if (shield > 0) {
                            shield = 0;
                        } else {
                            lives = lives - 1;
                            shakeTime = 40;
                            createParticleExplosion(
                                rocket.x + rocket.width / 2,
                                rocket.y + rocket.height / 2,
                                30
                            );
                        }
                        bullet.destroy();
                    }
                });

                // Boss <-> Bullets or Rocket
                if (boss) {
                    bullets.forEach((bullet) => {
                        if (isColliding(bullet, boss)) {
                            boss.hit();
                            bullet.destroy();
                        }
                    });
                    if (isColliding(rocket, boss)) {
                        if (rocket.activeShield > 0) {
                            rocket.activeShield--;
                            showShieldImpact(rocket.x + rocket.width / 2, rocket.y + rocket.height / 2);
                        } else if (shield > 0) {
                            shield = life - 1;
                        } else {
                            lives = lives - 1;
                            shakeTime = 10;
                            createParticleExplosion(
                                rocket.x + rocket.width / 2,
                                rocket.y + rocket.height / 2,
                                30
                            );
                        }
                        firedRockets.forEach((firedRocket) => {
                            if (isColliding(firedRocket, boss)) {
                                createParticleExplosion(firedRocket.x, firedRocket.y, 30);
                                firedRocket.destroy();
                            }
                        });
                    }
                }

                // TON Collectible <-> Rocket
                for (let i = tonCollectibles.length - 1; i >= 0; i--) {
                    let tonItem = tonCollectibles[i];
                    if (isColliding(rocket, tonItem)) {
                        tonCount += TON_VALUE;
                        tonCollectibles.splice(i, 1);
                    }
                }

                // Rocket Power‑Up <-> Rocket
                for (let i = rocketCollectibles.length - 1; i >= 0; i--) {
                    let rocketItem = rocketCollectibles[i];
                    if (
                        rocket &&
                        rocketItem &&
                        rocket.x < rocketItem.x + rocketItem.width &&
                        rocket.x + rocket.width > rocketItem.x &&
                        rocket.y < rocketItem.y + rocketItem.height &&
                        rocket.y + rocket.height > rocketItem.y
                    ) {
                        rocketUses += 1;
                        rocketCollectibles.splice(i, 1);
                    }
                }


                // HUD
                drawText(`Score: ${score}`, 10, 30);
                drawText(`Lives: ${lives}`, canvas.width - 80, 30);
                drawText(`Level: ${level}`, 10, 60);
                if (shield > 0) {
                    drawShieldBar();
                }
                if (rocketUses > 0) {
                    drawRocketPowerUp();
                }
                drawExitButton();
                if (laserUses > 0) {
                    drawLaserPowerUp();
                }
                // drawText(`TON: ${tonCount.toFixed(6)}`, 10, 90);

                if (lives <= 0) {
                    setIsPaused(true);
                    pauseGame();
                    showPauseScreen(true);
                    if (!gameOverTriggered) {
                        createParticleExplosion(
                            rocket.x + rocket.width / 2,
                            rocket.y + rocket.height / 2,
                            30
                        );
                        gameOverTriggered = true;
                        setTimeout(() => { }, 500);
                        return;
                    }
                }

                if (autoShoot) {
                    shoot();
                }
                if (blueAutoShoot) {
                    shoot();
                }
            }

            ctx.restore();

            if (levelTransition !== null) {
                pauseOverlayAndLevelTransition();
            }
            if (levelTransitionRef.current !== null) {
                pauseOverlayAndLevelTransition();
            }
            // Update and draw boss laser beams
            bossLaserBeams.forEach((beam, index) => {
                beam.update(canvas);
                beam.draw(ctx, canvas);
                if (!beam.active) {
                    bossLaserBeams.splice(index, 1);
                } else {
                    // Check collision between boss laser beam and the rocket
                    if (
                        beam.rect &&
                        rocket.x < beam.rect.x + beam.rect.width &&
                        rocket.x + rocket.width > beam.rect.x &&
                        rocket.y < beam.rect.y + beam.rect.height &&
                        rocket.y + rocket.height > beam.rect.y
                    ) {
                        lives -= 0.5;
                        shakeTime = 10;
                        createParticleExplosion(
                            rocket.x + rocket.width / 2,
                            rocket.y + rocket.height / 2,
                            30
                        );
                    }
                }
            });

            animationFrame = requestAnimationFrame(gameLoop);
        };

        const shoot = () => {
            let numberOfGuns = 1;
            if (selectedNft) {
                const gunsAttribute = selectedNft.metadata.attributes.find(
                    (attr) => attr.trait_type === 'Guns'
                );
                if (gunsAttribute) {
                    numberOfGuns = parseInt(gunsAttribute.value, 10);
                }
            } else if (galaxyPlayer.ship_upgrades != null) {
                if (galaxyPlayer.ship_upgrades[1].Guns > 0) {
                    numberOfGuns += galaxyPlayer.ship_upgrades[1].Guns;
                }
            }
            for (let i = 0; i < numberOfGuns; i++) {
                const offset = (i - (numberOfGuns - 1) / 2) * 10;
                bullets.push(
                    new RocketBullet(rocket.x + rocket.width / 2 - 2.5 + offset, rocket.y)
                );
            }
        };

        animationFrame = requestAnimationFrame(gameLoop);

        return () => {
            cancelAnimationFrame(animationFrame);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
            canvas.removeEventListener('click', handleCanvasClick);
            stopSpawning();
            clearInterval(autoShootInterval);
        };
    }, [onGameOver, imagesLoaded, isAdReady]);

    return (
        <div
            style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'black'
            }}
        >
            {imagesLoaded && isAdReady ? (
                <canvas
                    ref={canvasRef}
                    style={{
                        border: '1px solid black',
                        width: '100%',
                        height: '90vh',
                        marginBottom: '0px',
                        marginTop: '0px',
                        zIndex: '9999999999999999999999'
                    }}
                />
            ) : (
                <div style={{ width: '80%', textAlign: 'center' }}>
                    <div style={{ color: 'white', fontSize: '24px', marginBottom: '10px' }}>
                        Loading...
                    </div>
                    {slowConnection && (
                        <div style={{ color: 'red', fontSize: '16px', marginBottom: '10px' }}>
                            Your internet connection is slow, you may experience some troubles while playing the game.
                        </div>
                    )}
                    <div
                        style={{
                            width: '100%',
                            height: '10px',
                            backgroundColor: '#444',
                            borderRadius: '5px',
                            overflow: 'hidden'
                        }}
                    >
                        <div
                            className="loading-bar"
                            style={{
                                width: `${loadingProgress}%`,
                                height: '100%',
                                backgroundColor: '#4caf50',
                                borderRadius: '5px'
                            }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Game;
