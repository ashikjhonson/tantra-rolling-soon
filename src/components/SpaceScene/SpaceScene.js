import React, { useRef, useEffect, useState } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Volume2, VolumeX } from "lucide-react";
import logo from "../../logo.png";

const GLTFModelViewer = () => {
  const mountRef = useRef(null);
  const modelRef = useRef(null);
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState(null);

  const initializeAudio = () => {
    try {
      const audio = new Audio();
      audio.src = "song.mp3"; // Update this path to your MP3 file location
      audio.type = "audio/mp3";
      audio.loop = true;

      // Add event listeners for better audio state management
      audio.addEventListener("canplaythrough", () => {
        setAudioLoaded(true);
        console.log("Audio loaded and ready to play");
      });

      audio.addEventListener("playing", () => {
        setIsPlaying(true);
        console.log("Audio started playing");
      });

      // Set volume to a comfortable level
      audio.volume = 0.5;

      audioRef.current = audio;
    } catch (error) {
      console.error("Audio initialization error:", error);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        // Try to play if paused
        audioRef.current.play().catch((error) => {
          console.warn("Audio play failed:", error);
        });
      }
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  // Initialize audio on component mount
  useEffect(() => {
    initializeAudio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "song.pm3";
      }
    };
  }, []);

  // Handle user interaction for audio autoplay
  useEffect(() => {
    const handleUserInteraction = () => {
      if (audioRef.current && audioLoaded && !isPlaying) {
        audioRef.current.play().catch((error) => {
          console.warn("Audio play failed on interaction:", error);
        });
      }
    };

    // Add multiple event listeners for better interaction handling
    const events = ["click", "touchstart", "keydown", "resize", "load"];
    events.forEach((event) => {
      window.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [audioLoaded, isPlaying]);

  // Main Three.js setup
  useEffect(() => {
    let animationFrameId;
    const currentRef = mountRef.current;
    const { clientWidth: width, clientHeight: height } = currentRef;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 2;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    currentRef.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(-5, 5, -5);
    scene.add(pointLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI * 0.45;

    // GLTF Loader
    const loader = new GLTFLoader();
    loader.load(
      "/space_boi/scene.gltf",
      (gltf) => {
        modelRef.current = gltf.scene;
        scene.add(gltf.scene);

        // Center and scale model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        camera.position.z = cameraZ * 2;
        camera.position.y = cameraZ;
        camera.updateProjectionMatrix();

        controls.target.copy(center);
        controls.update();

        setModelLoaded(true);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("Model loading error:", error);
        setError("Failed to load 3D model");
      }
    );

    // Animation loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (modelRef.current) {
        modelRef.current.rotation.y += 0.006;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      const { clientWidth, clientHeight } = currentRef;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      console.log("Cleaning up Three.js resources");
      // window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (object.material.length) {
            for (let material of object.material) {
              if (material.map) material.map.dispose();
              material.dispose();
            }
          } else {
            if (object.material.map) object.material.map.dispose();
            object.material.dispose();
          }
        }
      });

      renderer.dispose();
      currentRef.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
        }}
        className=""
      >
        <img src={logo} className="logoimg" />
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          fontFamily: "Pixelify Sans, sans-serif",
          textAlign: "top",
          animation: "float 3s, textGlow 2s ease-in-out infinite alternate",
          textShadow: "0 0 20px #FFFFFF", // Modify here by using a different approach for important
          letterSpacing: "1px",
        }}
        className="dt txt"
      >
        08/11
      </div>
      {/* Text Overlay */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          fontFamily: "Pixelify Sans, sans-serif",
          textAlign: "center",
          animation: "float 3s, textGlow 2s ease-in-out infinite alternate",
          textShadow: "0 0 20px #FFFFFF", // Modify here by using a different approach for important
          letterSpacing: "6px",
        }}
        className="txt "
      >
        ROLLING SOON
      </div>

      {/* Audio control button */}
      {/* <button
        onClick={toggleMute}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 1000,
          padding: "10px",
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          border: "none",
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          transition: "background-color 0.3s ease",
        }}
        aria-label={isMuted ? "Unmute" : "Mute"}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)")
        }
      >
        {isMuted ? (
          <VolumeX size={24} color="white" />
        ) : (
          <Volume2 size={24} color="white" />
        )}
      </button> */}

      {/* Main canvas container */}
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {/* Loading and error states */}
      {(!modelLoaded || !audioLoaded) && !error && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            color: "white",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            padding: "8px 16px",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          Loading... {!modelLoaded && "Model"} {!audioLoaded && "Audio"}
        </div>
      )}
      {error && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            color: "white",
            backgroundColor: "rgba(255, 0, 0, 0.5)",
            padding: "8px 16px",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          Error: {error}
        </div>
      )}

      {/* Add the CSS for the animations */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css?family=Teko:700&display=swap');
          
          @keyframes float {
            0% {
              transform: translate(-50%, -50%);
            }
            50% {
              transform: translate(-50%, -60%);
            }
            100% {
              transform: translate(-50%, -50%);
            }
          }

          @keyframes textGlow {
            0% {
              text-shadow: 0 0 10px #5966e2;
            }
            50% {
              text-shadow: 0 0 20px #5966e2, 0 0 20px #5966e2;
            }
            100% {
              text-shadow: 0 0 10px #5966e2;
            }
          }

          @keyframes pulse {
            0% {
              opacity: 1;
            }
            50% {
              opacity: 0.8;
            }
            100% {
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default GLTFModelViewer;
