"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useUser } from "../UserContext";
import Link from "next/link";
import { House } from "lucide-react";
import * as THREE from "three";

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

function ClickableNode({ node, onClick }: { node: GraphNode, onClick: (node: GraphNode) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const handleClick = (event: any) => {
    event.stopPropagation();
    onClick(node);
  };
  
  // Determine material properties based on node type
  const getMaterialProps = () => {
    if (node.type === 'user') {
      return {
        color: node.color,
        metalness: 0.1,
        roughness: 0.6,
        clearcoat: 0.3,
        clearcoatRoughness: 0.4
      };
    } else {
      return {
        color: node.color,
        emissive: node.glowIntensity ? node.color : '#000000',
        emissiveIntensity: node.glowIntensity || 0,
        metalness: 0.3,
        roughness: 0.4,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2
      };
    }
  };
  
  return (
    <group position={node.position}>
      <mesh ref={meshRef} onClick={handleClick}>
        <sphereGeometry args={[node.size, 16, 16]} />
        <meshPhysicalMaterial {...getMaterialProps()} />
      </mesh>
      
      {/* Enhanced glow effect for bright nodes */}
      {node.glowIntensity && node.glowIntensity > 0.2 && (
        <>
          {/* Inner glow */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[node.size * 2, 16, 16]} />
            <meshBasicMaterial 
              color={node.color}
              transparent
              opacity={node.glowIntensity * 0.4}
            />
          </mesh>
          {/* Outer diffuse glow */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[node.size * 3.5, 12, 12]} />
            <meshBasicMaterial 
              color={node.color}
              transparent
              opacity={node.glowIntensity * 0.15}
            />
          </mesh>
          {/* Far diffuse glow */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[node.size * 5, 8, 8]} />
            <meshBasicMaterial 
              color={node.color}
              transparent
              opacity={node.glowIntensity * 0.08}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

function NetworkGraph({ nodes, edges, onNodeClick }: { nodes: GraphNode[], edges: GraphEdge[], onNodeClick: (node: GraphNode) => void }) {
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

  return (
    <>
      {/* Enhanced Lighting Setup */}
      <ambientLight intensity={0.2} color="#1a1a2e" />
      
      {/* Key light */}
      <directionalLight 
        position={[10, 15, 5]} 
        intensity={1.2} 
        color="#ffffff"
        castShadow
      />
      
      {/* Fill light */}
      <directionalLight 
        position={[-8, 10, -5]} 
        intensity={0.6} 
        color="#4a90e2"
      />
      
      {/* Rim light */}
      <directionalLight 
        position={[0, -10, 10]} 
        intensity={0.4} 
        color="#ff6b6b"
      />
      
      {/* Point lights for atmospheric effect */}
      <pointLight position={[15, 8, 15]} intensity={0.5} color="#00ff88" />
      <pointLight position={[-15, -8, -15]} intensity={0.3} color="#ff4444" />
      
      {/* Render Nodes */}
      {nodes.map((node) => (
        <ClickableNode 
          key={node.id} 
          node={node} 
          onClick={handleNodeClick}
        />
      ))}

      {/* Render Edges */}
      {edges.map((edge, index) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        if (!sourceNode || !targetNode) return null;
        
        const start = sourceNode.position;
        const end = targetNode.position;
        
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
            <lineBasicMaterial color={edge.color} />
          </line>
        );
      })}
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
      let size = 0.08; // Much smaller base size
      
      // Normalize the score to 0-1 range for glow calculation
      const normalizedScore = scoreRange > 0 ? (listing.match_score - minScore) / scoreRange : 0;
      
      switch (listing.status) {
        case 'open':
          color = '#48cc6c'; // Bright pastel green
          glowIntensity = Math.max(0.5, normalizedScore * 1.2); // Stronger glow
          size = 0.08 + (normalizedScore * 0.06); // Size varies from 0.08 to 0.14 for open listings
          break;
        case 'taken':
          color = '#ff4444'; // Red
          size = 0.05; // Small fixed size
          break;
        case 'completed':
          color = '#ffa500'; // Orange
          size = 0.05; // Small fixed size
          break;
        case 'cancelled':
          color = '#8a8a8a'; // Gray
          size = 0.05; // Small fixed size
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
        glowIntensity: listing.status === 'open' ? glowIntensity : 0
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
        size: 0.06 // Smaller than listings
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
        <NetworkGraph nodes={nodes} edges={edges} onNodeClick={setSelectedNode} />
        
        {/* Controls */}
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
}
