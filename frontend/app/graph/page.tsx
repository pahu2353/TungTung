"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Canvas, useThree, extend, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useUser } from "../UserContext";
import Link from "next/link";
import { House } from "lucide-react";
import * as THREE from "three";

// Custom shader material for realistic glow
const glowVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPositionNormal;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = `
  uniform vec3 glowColor;
  uniform float glowIntensity;
  uniform float glowPower;
  varying vec3 vNormal;
  varying vec3 vPositionNormal;
  
  void main() {
    float intensity = pow(0.9 - dot(vNormal, vPositionNormal), glowPower);
    gl_FragColor = vec4(glowColor, intensity * glowIntensity);
  }
`;

// Outer glow shader for atmospheric effect
const outerGlowVertexShader = `
  varying vec3 vNormal;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const outerGlowFragmentShader = `
  uniform vec3 glowColor;
  uniform float glowIntensity;
  varying vec3 vNormal;
  
  void main() {
    float intensity = pow(0.9 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    gl_FragColor = vec4(glowColor, intensity * glowIntensity * 0.4);
  }
`;

interface GraphNode {
  id: string;
  type: 'user' | 'listing';
  data: any;
  position: [number, number, number];
  color: string;
  size: number;
  glowIntensity?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'posting' | 'assignment';
  color: string;
}

function ClickableNode({ 
  node, 
  onClick, 
  isHighlighted, 
  isFaded 
}: { 
  node: GraphNode, 
  onClick: (node: GraphNode) => void,
  isHighlighted: boolean,
  isFaded: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const handleClick = (event: any) => {
    event.stopPropagation();
    onClick(node);
  };
  
  // Convert hex color to RGB for shaders
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 1, g: 1, b: 1 };
  };
  
  // Apply fading effect to both display color and glow color
  const displayColor = isFaded ? '#666666' : node.color;
  const glowColor = isFaded ? '#666666' : node.color; // Use same faded color for glow
  
  const rgbColor = hexToRgb(displayColor);
  const colorVector = new THREE.Vector3(rgbColor.r, rgbColor.g, rgbColor.b);
  
  // Use the faded glow color for glow calculations
  const glowRgbColor = hexToRgb(glowColor);
  const glowColorVector = new THREE.Vector3(glowRgbColor.r, glowRgbColor.g, glowRgbColor.b);
  
  // Determine glow properties based on node type and status
  const getGlowProperties = () => {
    const baseProps = {
      glowIntensity: 0.4,
      glowRadius: 1.2,
      outerGlowRadius: 1.8
    };

    if (isFaded) {
      return {
        glowIntensity: baseProps.glowIntensity * 0.2, // Further reduce intensity for faded nodes
        glowRadius: baseProps.glowRadius,
        outerGlowRadius: baseProps.outerGlowRadius
      };
    }

    if (node.type === 'user') {
      return {
        glowIntensity: 0.4,
        glowRadius: 1.2,
        outerGlowRadius: 1.8
      };
    } else {
      // Listing node
      switch (node.data.status) {
        case 'open':
          return {
            glowIntensity: node.glowIntensity || 0.8,
            glowRadius: 1.3,
            outerGlowRadius: 2.0
          };
        case 'taken':
          return {
            glowIntensity: 0.5,
            glowRadius: 1.1,
            outerGlowRadius: 1.6
          };
        case 'completed':
          return {
            glowIntensity: 0.5,
            glowRadius: 1.1,
            outerGlowRadius: 1.6
          };
        case 'cancelled':
          return {
            glowIntensity: 0.3,
            glowRadius: 1.0,
            outerGlowRadius: 1.4
          };
        default:
          return baseProps;
      }
    }
  };
  
  const glowProps = getGlowProperties();
  
  return (
    <group position={node.position}>
      {/* Main node sphere */}
      <mesh ref={meshRef} onClick={handleClick}>
        <sphereGeometry args={[node.size, 32, 32]} />
        <meshPhysicalMaterial
          color={displayColor}
          emissive={displayColor}
          emissiveIntensity={isFaded ? 0.1 : 0.3}
          metalness={0.1}
          roughness={0.2}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
          opacity={isFaded ? 0.4 : 1.0}
          transparent={isFaded}
        />
      </mesh>
      
      {/* Only render glow if not faded */}
      {!isFaded && (
        <>
          {/* Inner glow layer */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[node.size * glowProps.glowRadius, 24, 24]} />
            <shaderMaterial
              vertexShader={glowVertexShader}
              fragmentShader={glowFragmentShader}
              uniforms={{
                glowColor: { value: glowColorVector },
                glowIntensity: { value: glowProps.glowIntensity },
                glowPower: { value: 1.5 }
              }}
              transparent={true}
              blending={THREE.AdditiveBlending}
              side={THREE.BackSide}
            />
          </mesh>
          
          {/* Outer atmospheric glow */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[node.size * glowProps.outerGlowRadius, 16, 16]} />
            <shaderMaterial
              vertexShader={outerGlowVertexShader}
              fragmentShader={outerGlowFragmentShader}
              uniforms={{
                glowColor: { value: glowColorVector },
                glowIntensity: { value: glowProps.glowIntensity * 0.6 }
              }}
              transparent={true}
              blending={THREE.AdditiveBlending}
              side={THREE.BackSide}
            />
          </mesh>
          
          {/* Additional soft glow for open listings */}
          {node.type === 'listing' && node.data.status === 'open' && (
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[node.size * 4, 12, 12]} />
              <meshBasicMaterial 
                color={node.color}
                transparent
                opacity={glowProps.glowIntensity * 0.08}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          )}
        </>
      )}
    </group>
  );
}

function CameraController({ 
  selectedNode, 
  controlsRef 
}: { 
  selectedNode: GraphNode | null,
  controlsRef: React.RefObject<any>
}) {
  const { camera } = useThree();
  const animationRef = useRef<{
    startTime: number;
    startPosition: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    duration: number;
    orbitRadius: number;
    orbitCenter: THREE.Vector3;
    startAngle: number;
    endAngle: number;
    totalAngleDelta: number;
    startHeight: number;
    endHeight: number;
  } | null>(null);

  useEffect(() => {
    if (selectedNode && controlsRef.current) {
      const controls = controlsRef.current;
      const nodePos = new THREE.Vector3(...selectedNode.position);
      
      // Calculate orbit parameters
      const orbitRadius = 5;
      const orbitCenter = nodePos.clone();
      
      // Calculate the starting angle based on current camera position relative to the target
      const currentRelativePos = camera.position.clone().sub(orbitCenter);
      const startAngle = Math.atan2(currentRelativePos.z, currentRelativePos.x);
      
      // Calculate end angle (about 230 degrees rotation)
      const endAngle = startAngle + Math.PI * 1.3;
      const totalAngleDelta = Math.PI * 1.3;
      
      // Heights for smooth vertical movement
      const startHeight = camera.position.y;
      const endHeight = orbitCenter.y + 1;
      
      // Start animation from current camera position
      animationRef.current = {
        startTime: Date.now(),
        startPosition: camera.position.clone(),
        startTarget: controls.target.clone(),
        endTarget: nodePos.clone(),
        duration: 2000,
        orbitRadius,
        orbitCenter,
        startAngle,
        endAngle,
        totalAngleDelta,
        startHeight,
        endHeight
      };
    }
  }, [selectedNode, camera, controlsRef]);

  useFrame(() => {
    if (animationRef.current && controlsRef.current) {
      const { 
        startTime, 
        startPosition, 
        startTarget, 
        endTarget, 
        duration, 
        orbitRadius, 
        orbitCenter,
        startAngle,
        endAngle,
        totalAngleDelta,
        startHeight,
        endHeight
      } = animationRef.current;
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easing with slight acceleration in middle
      const easeInOutQuart = (t: number) => {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
      };
      const easedProgress = easeInOutQuart(progress);

      // Calculate current angle with smooth interpolation
      const currentAngle = startAngle + (easedProgress * totalAngleDelta);
      
      // Calculate distance from orbit center (gradually move towards orbit radius)
      const startDistance = startPosition.distanceTo(orbitCenter);
      const currentDistance = startDistance + (orbitRadius - startDistance) * easedProgress;
      
      // Calculate height with smooth interpolation
      const currentHeight = startHeight + (endHeight - startHeight) * easedProgress;
      
      // Calculate current position using smooth orbital interpolation
      const currentPosition = new THREE.Vector3(
        orbitCenter.x + currentDistance * Math.cos(currentAngle),
        currentHeight,
        orbitCenter.z + currentDistance * Math.sin(currentAngle)
      );

      // Interpolate target position
      const currentTarget = startTarget.clone().lerp(endTarget, easedProgress);

      // Apply to camera and controls
      camera.position.copy(currentPosition);
      controlsRef.current.target.copy(currentTarget);
      controlsRef.current.update();
      
      // End animation
      if (progress >= 1) {
        animationRef.current = null;
      }
    }
  });

  return null;
}

function NetworkGraph({ 
  nodes, 
  edges, 
  onNodeClick, 
  selectedNode 
}: { 
  nodes: GraphNode[], 
  edges: GraphEdge[], 
  onNodeClick: (node: GraphNode) => void,
  selectedNode: GraphNode | null
}) {
  const controlsRef = useRef<any>(null);

  const handleNodeClick = (node: GraphNode) => {
    console.log('=== NODE CLICKED ===');
    console.log('Node Type:', node.type);
    console.log('Node ID:', node.id);
    console.log('Node Data:', node.data);
    console.log('Node Color:', node.color);
    console.log('Node Size:', node.size);
    if (node.glowIntensity) {
      console.log('Glow Intensity:', node.glowIntensity);
    }
    console.log('==================');
    onNodeClick(node);
  };

  // Calculate which nodes and edges should be highlighted
  const getHighlightedElements = () => {
    if (!selectedNode) return { highlightedNodes: new Set(), highlightedEdges: new Set() };
    
    const highlightedNodes = new Set([selectedNode.id]);
    const highlightedEdges = new Set<string>();
    
    // Find all edges connected to the selected node
    edges.forEach((edge, index) => {
      if (edge.source === selectedNode.id || edge.target === selectedNode.id) {
        highlightedEdges.add(`${edge.source}-${edge.target}-${index}`);
        // Add the other node in the edge
        highlightedNodes.add(edge.source === selectedNode.id ? edge.target : edge.source);
      }
    });
    
    return { highlightedNodes, highlightedEdges };
  };

  const { highlightedNodes, highlightedEdges } = getHighlightedElements();

  return (
    <>
      {/* Camera Controller */}
      <CameraController selectedNode={selectedNode} controlsRef={controlsRef} />

      {/* Enhanced Lighting Setup */}
      <ambientLight intensity={0.1} color="#0a0a0a" />
      
      {/* Key light - dimmed to let glow effects shine */}
      <directionalLight 
        position={[10, 15, 5]} 
        intensity={0.3} 
        color="#ffffff"
      />
      
      {/* Fill light - reduced */}
      <directionalLight 
        position={[-8, 10, -5]} 
        intensity={0.2} 
        color="#4a90e2"
      />
      
      {/* Rim light - reduced */}
      <directionalLight 
        position={[0, -10, 10]} 
        intensity={0.1} 
        color="#ff6b6b"
      />
      
      {/* Render Nodes */}
      {nodes.map((node) => {
        const isHighlighted = highlightedNodes.has(node.id);
        const isFaded = selectedNode !== null && !isHighlighted;
        
        return (
          <ClickableNode 
            key={node.id} 
            node={node} 
            onClick={handleNodeClick}
            isHighlighted={isHighlighted}
            isFaded={isFaded}
          />
        );
      })}

      {/* Render Edges */}
      {edges.map((edge, index) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        if (!sourceNode || !targetNode) return null;
        
        const start = sourceNode.position;
        const end = targetNode.position;
        const edgeKey = `${edge.source}-${edge.target}-${index}`;
        
        const isHighlighted = highlightedEdges.has(edgeKey);
        const isFaded = selectedNode !== null && !isHighlighted;
        const displayColor = isFaded ? '#444444' : edge.color;
        
        const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
        
        return (
          <line key={index}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={new Float32Array([...start, ...end])}
                count={2}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial 
              color={displayColor} 
              opacity={isFaded ? 0.3 : 1.0}
              transparent={isFaded}
            />
          </line>
        );
      })}

      {/* Controls */}
      <OrbitControls 
        ref={controlsRef}
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true} 
      />
    </>
  );
}

export default function GraphPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [postings, setPostings] = useState<{ uid: number; listid: number }[]>([]);
  const [assignments, setAssignments] = useState<{ uid: number; listid: number }[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Get user's geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
      });
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch postings, assignments, and users
        const postingsRes = await fetch("http://localhost:8080/postings");
        const assignmentsRes = await fetch("http://localhost:8080/assignments");
        const usersRes = await fetch("http://localhost:8080/info/users");

        // Fetch listings with match scores
        const params = new URLSearchParams();
        params.append("sort", "--");
        params.append("search", "");
        params.append("uid", user?.uid?.toString() || "0");
        params.append("latitude", userLocation?.latitude?.toString() || "43.4723");
        params.append("longitude", userLocation?.longitude?.toString() || "-80.5449");
        
        const listingsRes = await fetch(`http://localhost:8080/listings/filterAndSort?${params.toString()}`);

        if (!postingsRes.ok || !assignmentsRes.ok || !listingsRes.ok || !usersRes.ok) {
          throw new Error("Failed to fetch graph data");
        }

        const postingsData = await postingsRes.json();
        const assignmentsData = await assignmentsRes.json();
        const listingsData = await listingsRes.json();
        const usersData = await usersRes.json();

        setPostings(postingsData);
        setAssignments(assignmentsData);
        setListings(listingsData);
        setUsers(usersData);

        // Debug: log first 10 items
        console.log("=== GRAPH DATA DEBUG ===");
        console.log("Listings (first 10):", listingsData.slice(0, 10));
        console.log("Users (first 10):", usersData.slice(0, 10));
        console.log("Posting Edges (first 10):", postingsData.slice(0, 10));
        console.log("Assignment Edges (first 10):", assignmentsData.slice(0, 10));

        setError(null);
      } catch (err) {
        console.error("Error fetching graph data:", err);
        setError("Failed to load graph data");
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch data when user and userLocation are available
    if (user && userLocation) {
      fetchData();
    }
  }, [user, userLocation]);

  const { nodes, edges } = useMemo(() => {
    if (!listings.length || !users.length) return { nodes: [], edges: [] };
    
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    
    // Calculate score distribution for brightness/glow mapping
    const scores = listings.map(l => l.match_score || 0).filter(s => !isNaN(s));
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const scoreRange = maxScore - minScore || 1; // Avoid division by zero
    
    // Create listing nodes
    listings.forEach((listing, index) => {
      const angle = (index / listings.length) * Math.PI * 2;
      const radius = 8;
      
      let color = '#4a5568'; // Default dim gray
      let glowIntensity = 0;
      let size = 0.05; // Fixed smaller size for non-open listings
      
      // Normalize the score to 0-1 range for glow calculation
      const normalizedScore = scoreRange > 0 ? (listing.match_score - minScore) / scoreRange : 0;
      
      switch (listing.status) {
        case 'open':
          color = '#48cc6c'; // Bright pastel green
          glowIntensity = Math.max(0.5, normalizedScore * 1.2); // Stronger glow
          size = 0.08 + (normalizedScore * 0.06); // Size varies from 0.08 to 0.14 for open listings only
          break;
        case 'taken':
          color = '#ff6666'; // Brighter red
          glowIntensity = 0.5;
          break;
        case 'completed':
          color = '#ffaa44'; // Brighter orange/yellow
          glowIntensity = 0.5;
          break;
        case 'cancelled':
          color = '#aaaaaa'; // Brighter gray
          glowIntensity = 0.3;
          break;
      }
      
      nodes.push({
        id: `listing_${listing.listid}`,
        type: 'listing',
        data: listing,
        position: [
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 4,
          Math.sin(angle) * radius
        ],
        color,
        size,
        glowIntensity
      });
    });
    
    // Create user nodes
    users.forEach((userData, index) => {
      const angle = (index / users.length) * Math.PI * 2;
      const radius = 12;
      
      nodes.push({
        id: `user_${userData.uid}`,
        type: 'user',
        data: userData,
        position: [
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 2,
          Math.sin(angle) * radius
        ],
        color: '#ffffff', // White
        size: 0.06, // Smaller than listings
        glowIntensity: 0.4
      });
    });
    
    // Create posting edges (teal/blue-green)
    postings.forEach((posting) => {
      const sourceExists = nodes.some(n => n.id === `user_${posting.uid}`);
      const targetExists = nodes.some(n => n.id === `listing_${posting.listid}`);
      
      if (sourceExists && targetExists) {
        edges.push({
          source: `user_${posting.uid}`,
          target: `listing_${posting.listid}`,
          type: 'posting',
          color: '#4fd1c7' // Bright pastel teal
        });
      }
    });
    
    // Create assignment edges (white)
    assignments.forEach((assignment) => {
      const sourceExists = nodes.some(n => n.id === `user_${assignment.uid}`);
      const targetExists = nodes.some(n => n.id === `listing_${assignment.listid}`);
      
      if (sourceExists && targetExists) {
        edges.push({
          source: `user_${assignment.uid}`,
          target: `listing_${assignment.listid}`,
          type: 'assignment',
          color: '#ffffff' // White
        });
      }
    });
    
    console.log("=== PROCESSED GRAPH ===");
    console.log("Nodes:", nodes.slice(0, 10));
    console.log("Edges:", edges.slice(0, 10));
    console.log("Score range:", { minScore, maxScore, scoreRange });
    
    return { nodes, edges };
  }, [listings, users, postings, assignments]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading network graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black relative">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/" className="inline-flex items-center text-white hover:text-gray-300 transition-colors">
          <House className="w-6 h-6" />
          <span className="ml-2">Back to Home</span>
        </Link>
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute top-16 left-4 z-10 bg-black bg-opacity-75 p-4 rounded-lg text-white text-sm max-w-md">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg">
              {selectedNode.type === 'user' ? 'User' : 'Listing'} Details
            </h3>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
          
          {selectedNode.type === 'user' ? (
            <div className="space-y-1">
              <div><strong>Name:</strong> {selectedNode.data.name || 'N/A'}</div>
              <div><strong>Email:</strong> {selectedNode.data.email || 'N/A'}</div>
              <div><strong>UID:</strong> {selectedNode.data.uid || 'N/A'}</div>
              <div><strong>Phone:</strong> {selectedNode.data.phone || 'N/A'}</div>
              <div><strong>Rating:</strong> {selectedNode.data.rating || 'N/A'}</div>
            </div>
          ) : (
            <div className="space-y-1">
              <div><strong>Title:</strong> {selectedNode.data.listing_name || 'N/A'}</div>
              <div><strong>Description:</strong> {selectedNode.data.listing_description || 'N/A'}</div>
              <div><strong>Status:</strong> <span className="capitalize">{selectedNode.data.status}</span></div>
              <div><strong>Price:</strong> ${selectedNode.data.price || 'N/A'}</div>
              <div><strong>Match Score:</strong> {selectedNode.data.match_score?.toFixed(2) || 'N/A'}</div>
              <div><strong>Location:</strong> {selectedNode.data.location || 'N/A'}</div>
              <div><strong>Category:</strong> {selectedNode.data.category || 'N/A'}</div>
              <div><strong>Created:</strong> {selectedNode.data.date_created ? new Date(selectedNode.data.date_created).toLocaleDateString() : 'N/A'}</div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-75 p-4 rounded-lg text-white text-sm">
        <h3 className="font-bold mb-2">Legend</h3>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Open Listings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Taken Listings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Completed Listings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <span>Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-teal-400"></div>
            <span>Posted By</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-white"></div>
            <span>Assigned To</span>
          </div>
        </div>
      </div>

      {/* 3D Canvas - Full Screen */}
      <Canvas 
        camera={{ position: [15, 10, 15], fov: 60 }}
        style={{ width: '100vw', height: '100vh' }}
      >
        <color attach="background" args={['#000000']} />
        
        {/* Network Graph */}
        <NetworkGraph 
          nodes={nodes} 
          edges={edges} 
          onNodeClick={setSelectedNode} 
          selectedNode={selectedNode}
        />
      </Canvas>
    </div>
  );
}
