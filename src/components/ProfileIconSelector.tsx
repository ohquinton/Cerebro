'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Circle,
  Square,
  Triangle,
  Star,
  Heart,
  User,
  Smile,
  Sun,
  Moon,
  Cloud,
  Diamond,
  Leaf,
  Zap,
  Music,
  Gift,
  Droplet,
  Flame,
  Cherry,
  Apple,
  Banana,
  Pizza,
  Utensils,
  Gamepad,
  Crown,
  Medal,
  Trophy,
  Compass,
  Globe,
  Flag,
  Hexagon,
  Octagon,
  Camera, // Import Camera component
  LucideProps
} from 'lucide-react';

// Define colors for presets (simplified)
const COLOR_PRESETS = [
  "#FFFFFF", // White
  "#0a82b8", // Blue
  "#2e7d32", // Green
  "#4a148c", // Purple
  "#e65100", // Orange
  "#d32f2f", // Red
  "#ffeb3b", // Yellow
  "#00bcd4", // Cyan
  "#e91e63", // Pink
  "#009688", // Teal
  "#795548", // Brown
  "#607d8b", // Blue Gray
];

// Define icon type
interface IconInfo {
  id: string;
  name: string;
  color?: string;
  icon: React.ReactNode;
  iconType?: string; // Store the icon type as a string
  category: string;
}

// Create a flat list of icons with categories
const ALL_ICONS: IconInfo[] = [
  // Shapes
  { id: 'circle', name: 'Circle', color: "#ffffff", icon: <Circle />, iconType: 'Circle', category: 'Shapes' },
  { id: 'square', name: 'Square', color: "#ffffff", icon: <Square />, iconType: 'Square', category: 'Shapes' },
  { id: 'triangle', name: 'Triangle', color: "#ffffff", icon: <Triangle />, iconType: 'Triangle', category: 'Shapes' },
  { id: 'diamond', name: 'Diamond', color: "#ffffff", icon: <Diamond />, iconType: 'Diamond', category: 'Shapes' },
  { id: 'hexagon', name: 'Hexagon', color: "#ffffff", icon: <Hexagon />, iconType: 'Hexagon', category: 'Shapes' },
  { id: 'octagon', name: 'Octagon', color: "#ffffff", icon: <Octagon />, iconType: 'Octagon', category: 'Shapes' },
  
  // Nature
  { id: 'leaf', name: 'Leaf', color: "#ffffff", icon: <Leaf />, iconType: 'Leaf', category: 'Nature' },
  { id: 'sun', name: 'Sun', color: "#ffffff", icon: <Sun />, iconType: 'Sun', category: 'Nature' },
  { id: 'moon', name: 'Moon', color: "#ffffff", icon: <Moon />, iconType: 'Moon', category: 'Nature' },
  { id: 'cloud', name: 'Cloud', color: "#ffffff", icon: <Cloud />, iconType: 'Cloud', category: 'Nature' },
  { id: 'droplet', name: 'Droplet', color: "#ffffff", icon: <Droplet />, iconType: 'Droplet', category: 'Nature' },
  { id: 'flame', name: 'Flame', color: "#ffffff", icon: <Flame />, iconType: 'Flame', category: 'Nature' },
  
  // Fun
  { id: 'smile', name: 'Smile', color: "#ffffff", icon: <Smile />, iconType: 'Smile', category: 'Fun' },
  { id: 'heart', name: 'Heart', color: "#ffffff", icon: <Heart />, iconType: 'Heart', category: 'Fun' },
  { id: 'music', name: 'Music', color: "#ffffff", icon: <Music />, iconType: 'Music', category: 'Fun' },
  { id: 'gift', name: 'Gift', color: "#ffffff", icon: <Gift />, iconType: 'Gift', category: 'Fun' },
  { id: 'gamepad', name: 'Gamepad', color: "#ffffff", icon: <Gamepad />, iconType: 'Gamepad', category: 'Fun' },
  { id: 'camera', name: 'Camera', color: "#ffffff", icon: <Camera />, iconType: 'Camera', category: 'Fun' },
  
  // Food
  { id: 'cherry', name: 'Cherry', color: "#ffffff", icon: <Cherry />, iconType: 'Cherry', category: 'Food' },
  { id: 'apple', name: 'Apple', color: "#ffffff", icon: <Apple />, iconType: 'Apple', category: 'Food' },
  { id: 'banana', name: 'Banana', color: "#ffffff", icon: <Banana />, iconType: 'Banana', category: 'Food' },
  { id: 'pizza', name: 'Pizza', color: "#ffffff", icon: <Pizza />, iconType: 'Pizza', category: 'Food' },
  { id: 'utensils', name: 'Utensils', color: "#ffffff", icon: <Utensils />, iconType: 'Utensils', category: 'Food' },
  
  // Awards
  { id: 'star', name: 'Star', color: "#ffffff", icon: <Star />, iconType: 'Star', category: 'Awards' },
  { id: 'crown', name: 'Crown', color: "#ffffff", icon: <Crown />, iconType: 'Crown', category: 'Awards' },
  { id: 'medal', name: 'Medal', color: "#ffffff", icon: <Medal />, iconType: 'Medal', category: 'Awards' },
  { id: 'trophy', name: 'Trophy', color: "#ffffff", icon: <Trophy />, iconType: 'Trophy', category: 'Awards' },
  { id: 'zap', name: 'Lightning', color: "#ffffff", icon: <Zap />, iconType: 'Zap', category: 'Awards' },
  
  // Simple
  { id: 'initial', name: 'Initial', category: 'Simple', icon: <></> },
  { id: 'user', name: 'User', color: "#ffffff", icon: <User />, iconType: 'User', category: 'Simple' },
  { id: 'flag', name: 'Flag', color: "#ffffff", icon: <Flag />, iconType: 'Flag', category: 'Simple' },
  { id: 'compass', name: 'Compass', color: "#ffffff", icon: <Compass />, iconType: 'Compass', category: 'Simple' },
  { id: 'globe', name: 'Globe', color: "#ffffff", icon: <Globe />, iconType: 'Globe', category: 'Simple' },
];

interface ProfileIconSelectorProps {
  userInitial: string;
  selectedIcon: string;
  onIconChange: (iconId: string, iconSvg?: string) => void;
  size?: number;
}

export const ProfileIconSelector: React.FC<ProfileIconSelectorProps> = ({
  userInitial,
  selectedIcon,
  onIconChange,
  size = 40,
}) => {
  // States
  const [selectedColor, setSelectedColor] = useState<string>("#ffffff");
  const [currentIconInfo, setCurrentIconInfo] = useState<IconInfo | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Find and update the current icon info when selectedIcon changes
  useEffect(() => {
    const foundIcon = ALL_ICONS.find(icon => icon.id === selectedIcon);
    if (foundIcon) {
      setCurrentIconInfo(foundIcon);
      
      // Load saved color from localStorage or use default
      const savedColor = localStorage.getItem(`profileIcon_${selectedIcon}_color`);
      if (savedColor) {
        setSelectedColor(savedColor);
      } else if (foundIcon.color) {
        setSelectedColor(foundIcon.color);
      }
    }
  }, [selectedIcon]);
  
  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Convert a Lucide React icon to SVG string
  const iconToSvgString = (iconInfo: IconInfo, color: string): string => {
    if (iconInfo.id === 'initial') {
      // For initial icon, create a simple SVG with text
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <text x="${size/2}" y="${size/2 + 5}" font-family="Arial" font-size="${size/2}" fill="${color}" text-anchor="middle">${userInitial || '•'}</text>
      </svg>`;
    }
    
    if (!iconInfo.icon) return '';
    
    try {
      // Use a simplified SVG approach since directly rendering React components is complex
      // For Lucide icons, we can construct SVGs manually based on the icon type
      const iconType = iconInfo.iconType || '';
      
      let svgContent = '';
      const svgSize = Math.floor(size * 0.7);
      
      // Create SVG path based on icon type
      switch (iconType) {
        case 'Circle':
          svgContent = `<circle cx="${svgSize/2}" cy="${svgSize/2}" r="${svgSize/2 - 2}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Square':
          svgContent = `<rect x="2" y="2" width="${svgSize - 4}" height="${svgSize - 4}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Triangle':
          svgContent = `<polygon points="${svgSize/2},2 ${svgSize-2},${svgSize-2} 2,${svgSize-2}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Diamond': 
          svgContent = `<polygon points="${svgSize/2},2 ${svgSize-2},${svgSize/2} ${svgSize/2},${svgSize-2} 2,${svgSize/2}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Hexagon':
          svgContent = `<polygon points="${svgSize*0.25},2 ${svgSize*0.75},2 ${svgSize-2},${svgSize/2} ${svgSize*0.75},${svgSize-2} ${svgSize*0.25},${svgSize-2} 2,${svgSize/2}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Octagon':
          svgContent = `<polygon points="${svgSize*0.3},2 ${svgSize*0.7},2 ${svgSize-2},${svgSize*0.3} ${svgSize-2},${svgSize*0.7} ${svgSize*0.7},${svgSize-2} ${svgSize*0.3},${svgSize-2} 2,${svgSize*0.7} 2,${svgSize*0.3}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Star':
          svgContent = `<path d="M${svgSize/2},2 L${svgSize*0.6},${svgSize*0.4} L${svgSize-2},${svgSize*0.4} L${svgSize*0.7},${svgSize*0.6} L${svgSize*0.8},${svgSize-2} L${svgSize/2},${svgSize*0.7} L${svgSize*0.2},${svgSize-2} L${svgSize*0.3},${svgSize*0.6} L2,${svgSize*0.4} L${svgSize*0.4},${svgSize*0.4} Z" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Heart':
          svgContent = `<path d="M${svgSize/2},${svgSize-2} C${svgSize/3},${svgSize*0.7} 2,${svgSize*0.4} 2,${svgSize*0.3} C2,${svgSize*0.2} ${svgSize*0.3},2 ${svgSize/2},${svgSize*0.3} C${svgSize*0.7},2 ${svgSize-2},${svgSize*0.2} ${svgSize-2},${svgSize*0.3} C${svgSize-2},${svgSize*0.4} ${svgSize*0.7},${svgSize*0.7} ${svgSize/2},${svgSize-2} Z" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'User':
          svgContent = `<circle cx="${svgSize/2}" cy="${svgSize*0.3}" r="${svgSize*0.2}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.2},${svgSize*0.9} C${svgSize*0.2},${svgSize*0.7} ${svgSize*0.3},${svgSize*0.5} ${svgSize/2},${svgSize*0.5} C${svgSize*0.7},${svgSize*0.5} ${svgSize*0.8},${svgSize*0.7} ${svgSize*0.8},${svgSize*0.9}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Smile':
          svgContent = `<circle cx="${svgSize/2}" cy="${svgSize/2}" r="${svgSize/2 - 2}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.3},${svgSize*0.4} L${svgSize*0.3},${svgSize*0.4}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.7},${svgSize*0.4} L${svgSize*0.7},${svgSize*0.4}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.3},${svgSize*0.6} C${svgSize*0.3},${svgSize*0.8} ${svgSize*0.7},${svgSize*0.8} ${svgSize*0.7},${svgSize*0.6}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Sun':
          svgContent = `<circle cx="${svgSize/2}" cy="${svgSize/2}" r="${svgSize/3}" fill="none" stroke="${color}" stroke-width="2" />
            <line x1="${svgSize/2}" y1="2" x2="${svgSize/2}" y2="${svgSize*0.2}" stroke="${color}" stroke-width="2" />
            <line x1="${svgSize/2}" y1="${svgSize*0.8}" x2="${svgSize/2}" y2="${svgSize-2}" stroke="${color}" stroke-width="2" />
            <line x1="2" y1="${svgSize/2}" x2="${svgSize*0.2}" y2="${svgSize/2}" stroke="${color}" stroke-width="2" />
            <line x1="${svgSize*0.8}" y1="${svgSize/2}" x2="${svgSize-2}" y2="${svgSize/2}" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Moon':
          svgContent = `<path d="M${svgSize*0.7},${svgSize*0.2} C${svgSize*0.5},${svgSize*0.1} ${svgSize*0.2},${svgSize*0.2} ${svgSize*0.1},${svgSize*0.5} C${svgSize*0.1},${svgSize*0.8} ${svgSize*0.4},${svgSize-2} ${svgSize*0.7},${svgSize-2} C${svgSize*0.6},${svgSize*0.8} ${svgSize*0.5},${svgSize*0.6} ${svgSize*0.6},${svgSize*0.4} C${svgSize*0.6},${svgSize*0.3} ${svgSize*0.7},${svgSize*0.2} ${svgSize*0.7},${svgSize*0.2} Z" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Cloud':
          svgContent = `<path d="M${svgSize*0.2},${svgSize*0.6} C${svgSize*0.1},${svgSize*0.5} ${svgSize*0.1},${svgSize*0.3} ${svgSize*0.3},${svgSize*0.3} C${svgSize*0.3},${svgSize*0.1} ${svgSize*0.7},${svgSize*0.1} ${svgSize*0.8},${svgSize*0.3} C${svgSize-2},${svgSize*0.2} ${svgSize-2},${svgSize*0.5} ${svgSize*0.8},${svgSize*0.6} Z" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Droplet':
          svgContent = `<path d="M${svgSize/2},2 C${svgSize*0.7},${svgSize*0.3} ${svgSize-2},${svgSize*0.5} ${svgSize-2},${svgSize*0.7} C${svgSize-2},${svgSize*0.9} ${svgSize*0.7},${svgSize-2} ${svgSize/2},${svgSize-2} C${svgSize*0.3},${svgSize-2} 2,${svgSize*0.9} 2,${svgSize*0.7} C2,${svgSize*0.5} ${svgSize*0.3},${svgSize*0.3} ${svgSize/2},2 Z" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Flame':
          svgContent = `<path d="M${svgSize/2},2 C${svgSize*0.6},${svgSize*0.3} ${svgSize-2},${svgSize*0.4} ${svgSize-2},${svgSize*0.7} C${svgSize-2},${svgSize-2} ${svgSize*0.2},${svgSize-2} ${svgSize*0.2},${svgSize*0.7} C${svgSize*0.2},${svgSize*0.5} ${svgSize*0.4},${svgSize*0.3} ${svgSize/2},2 Z" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Leaf':
          svgContent = `<path d="M2,2 C${svgSize-2},${svgSize-2} ${svgSize-2},2 2,${svgSize-2} Z" fill="none" stroke="${color}" stroke-width="2" />
            <line x1="2" y1="2" x2="${svgSize-2}" y2="${svgSize-2}" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Music':
          svgContent = `<circle cx="${svgSize*0.3}" cy="${svgSize*0.7}" r="${svgSize*0.15}" fill="none" stroke="${color}" stroke-width="2" />
            <circle cx="${svgSize*0.7}" cy="${svgSize*0.8}" r="${svgSize*0.15}" fill="none" stroke="${color}" stroke-width="2" />
            <line x1="${svgSize*0.45}" y1="${svgSize*0.7}" x2="${svgSize*0.45}" y2="${svgSize*0.2}" stroke="${color}" stroke-width="2" />
            <line x1="${svgSize*0.85}" y1="${svgSize*0.8}" x2="${svgSize*0.85}" y2="${svgSize*0.3}" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.45},${svgSize*0.2} L${svgSize*0.85},${svgSize*0.3}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Gift':
          svgContent = `<rect x="2" y="${svgSize*0.4}" width="${svgSize-4}" height="${svgSize*0.6-2}" fill="none" stroke="${color}" stroke-width="2" />
            <line x1="${svgSize/2}" y1="${svgSize*0.4}" x2="${svgSize/2}" y2="${svgSize-2}" stroke="${color}" stroke-width="2" />
            <path d="M2,${svgSize*0.4} L${svgSize-2},${svgSize*0.4}" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize/2},${svgSize*0.4} C${svgSize*0.3},${svgSize*0.3} ${svgSize*0.3},${svgSize*0.1} ${svgSize*0.4},2 C${svgSize*0.5},${svgSize*0.1} ${svgSize*0.5},${svgSize*0.3} ${svgSize/2},${svgSize*0.4}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize/2},${svgSize*0.4} C${svgSize*0.7},${svgSize*0.3} ${svgSize*0.7},${svgSize*0.1} ${svgSize*0.6},2 C${svgSize*0.5},${svgSize*0.1} ${svgSize*0.5},${svgSize*0.3} ${svgSize/2},${svgSize*0.4}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Camera':
          svgContent = `<rect x="2" y="${svgSize*0.3}" width="${svgSize-4}" height="${svgSize*0.6}" rx="2" fill="none" stroke="${color}" stroke-width="2" />
            <circle cx="${svgSize/2}" cy="${svgSize*0.55}" r="${svgSize*0.15}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.3},${svgSize*0.3} L${svgSize*0.4},${svgSize*0.2} L${svgSize*0.6},${svgSize*0.2} L${svgSize*0.7},${svgSize*0.3}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Gamepad':
          svgContent = `<rect x="2" y="${svgSize*0.3}" width="${svgSize-4}" height="${svgSize*0.4}" rx="${svgSize*0.1}" fill="none" stroke="${color}" stroke-width="2" />
            <circle cx="${svgSize*0.7}" cy="${svgSize*0.5}" r="${svgSize*0.07}" fill="none" stroke="${color}" stroke-width="2" />
            <circle cx="${svgSize*0.85}" cy="${svgSize*0.5}" r="${svgSize*0.07}" fill="none" stroke="${color}" stroke-width="2" />
            <line x1="${svgSize*0.3}" y1="${svgSize*0.5}" x2="${svgSize*0.3}" y2="${svgSize*0.4}" stroke="${color}" stroke-width="2" />
            <line x1="${svgSize*0.25}" y1="${svgSize*0.45}" x2="${svgSize*0.35}" y2="${svgSize*0.45}" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Cherry':
          svgContent = `<circle cx="${svgSize*0.3}" cy="${svgSize*0.7}" r="${svgSize*0.2}" fill="none" stroke="${color}" stroke-width="2" />
            <circle cx="${svgSize*0.7}" cy="${svgSize*0.7}" r="${svgSize*0.2}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.3},${svgSize*0.5} C${svgSize*0.4},${svgSize*0.3} ${svgSize*0.6},${svgSize*0.3} ${svgSize*0.7},${svgSize*0.5}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize/2},${svgSize*0.3} L${svgSize/2},2" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Apple':
          svgContent = `<circle cx="${svgSize/2}" cy="${svgSize*0.6}" r="${svgSize*0.35}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize/2},${svgSize*0.25} C${svgSize*0.6},${svgSize*0.25} ${svgSize*0.7},${svgSize*0.15} ${svgSize*0.65},2" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Banana':
          svgContent = `<path d="M${svgSize*0.2},${svgSize*0.2} C${svgSize*0.1},${svgSize*0.4} ${svgSize*0.3},${svgSize*0.8} ${svgSize*0.6},${svgSize-2} C${svgSize*0.8},${svgSize*0.8} ${svgSize-2},${svgSize*0.4} ${svgSize*0.8},${svgSize*0.3} C${svgSize*0.6},${svgSize*0.1} ${svgSize*0.3},${svgSize*0.1} ${svgSize*0.2},${svgSize*0.2} Z" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Pizza':
          svgContent = `<path d="M2,${svgSize-2} L${svgSize/2},2 L${svgSize-2},${svgSize-2} Z" fill="none" stroke="${color}" stroke-width="2" />
            <circle cx="${svgSize*0.3}" cy="${svgSize*0.6}" r="${svgSize*0.05}" fill="none" stroke="${color}" stroke-width="2" />
            <circle cx="${svgSize*0.5}" cy="${svgSize*0.4}" r="${svgSize*0.05}" fill="none" stroke="${color}" stroke-width="2" />
            <circle cx="${svgSize*0.7}" cy="${svgSize*0.7}" r="${svgSize*0.05}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Utensils':
          svgContent = `<path d="M${svgSize*0.3},2 L${svgSize*0.3},${svgSize-2}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.5},2 L${svgSize*0.5},${svgSize*0.4} C${svgSize*0.5},${svgSize*0.6} ${svgSize*0.6},${svgSize*0.7} ${svgSize*0.7},${svgSize*0.7} C${svgSize*0.8},${svgSize*0.7} ${svgSize*0.85},${svgSize*0.6} ${svgSize*0.85},${svgSize*0.4} L${svgSize*0.85},2" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.7},${svgSize*0.7} L${svgSize*0.7},${svgSize-2}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Crown':
          svgContent = `<path d="M2,${svgSize*0.6} L${svgSize*0.25},${svgSize*0.3} L${svgSize/2},${svgSize*0.6} L${svgSize*0.75},${svgSize*0.3} L${svgSize-2},${svgSize*0.6} L${svgSize-2},${svgSize*0.8} L2,${svgSize*0.8} Z" fill="none" stroke="${color}" stroke-width="2" />
            <line x1="2" y1="${svgSize*0.7}" x2="${svgSize-2}" y2="${svgSize*0.7}" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Medal':
          svgContent = `<circle cx="${svgSize/2}" cy="${svgSize*0.6}" r="${svgSize*0.3}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.3},${svgSize*0.35} L${svgSize*0.2},2 L${svgSize*0.4},${svgSize*0.15} L${svgSize/2},2 L${svgSize*0.6},${svgSize*0.15} L${svgSize*0.8},2 L${svgSize*0.7},${svgSize*0.35}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Trophy':
          svgContent = `<rect x="${svgSize*0.35}" y="${svgSize*0.8}" width="${svgSize*0.3}" height="${svgSize*0.15}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.4},${svgSize*0.8} L${svgSize*0.4},${svgSize*0.2} L${svgSize*0.6},${svgSize*0.2} L${svgSize*0.6},${svgSize*0.8}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.4},${svgSize*0.2} L${svgSize*0.2},${svgSize*0.2} C${svgSize*0.2},${svgSize*0.4} ${svgSize*0.3},${svgSize*0.5} ${svgSize*0.4},${svgSize*0.5}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.6},${svgSize*0.2} L${svgSize*0.8},${svgSize*0.2} C${svgSize*0.8},${svgSize*0.4} ${svgSize*0.7},${svgSize*0.5} ${svgSize*0.6},${svgSize*0.5}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Zap':
          svgContent = `<path d="M${svgSize*0.5},2 L${svgSize*0.2},${svgSize*0.5} L${svgSize*0.4},${svgSize*0.5} L${svgSize*0.3},${svgSize-2} L${svgSize*0.7},${svgSize*0.5} L${svgSize*0.5},${svgSize*0.5} Z" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Flag':
          svgContent = `<line x1="${svgSize*0.3}" y1="2" x2="${svgSize*0.3}" y2="${svgSize-2}" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.3},${svgSize*0.2} L${svgSize*0.8},${svgSize*0.2} L${svgSize*0.7},${svgSize*0.4} L${svgSize*0.8},${svgSize*0.6} L${svgSize*0.3},${svgSize*0.6}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Compass':
          svgContent = `<circle cx="${svgSize/2}" cy="${svgSize/2}" r="${svgSize/2 - 2}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.3},${svgSize*0.3} L${svgSize*0.7},${svgSize*0.7}" fill="none" stroke="${color}" stroke-width="2" />
            <path d="M${svgSize*0.3},${svgSize*0.7} L${svgSize*0.7},${svgSize*0.3}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
        case 'Globe':
          svgContent = `<circle cx="${svgSize/2}" cy="${svgSize/2}" r="${svgSize/2 - 2}" fill="none" stroke="${color}" stroke-width="2" />
            <ellipse cx="${svgSize/2}" cy="${svgSize/2}" rx="${svgSize/2 - 2}" ry="${svgSize*0.2}" fill="none" stroke="${color}" stroke-width="2" />
            <line x1="2" y1="${svgSize/2}" x2="${svgSize-2}" y2="${svgSize/2}" stroke="${color}" stroke-width="2" />
            <line x1="${svgSize/2}" y1="2" x2="${svgSize/2}" y2="${svgSize-2}" stroke="${color}" stroke-width="2" />`;
          break;
        default:
          // Generic circle for other icons
          svgContent = `<circle cx="${svgSize/2}" cy="${svgSize/2}" r="${svgSize/2 - 2}" fill="none" stroke="${color}" stroke-width="2" />`;
          break;
      }
      
      // Return SVG without any background element
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <g transform="translate(${(size - svgSize)/2}, ${(size - svgSize)/2})">
          ${svgContent}
        </g>
      </svg>`;
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error creating SVG string: ${error.message}`);
      } else {
        console.error("Unknown error creating SVG string");
      }
      return '';
    }
  };

  // Get visible icons based on active category
  const getVisibleIcons = (): IconInfo[] => {
    return ALL_ICONS;
  };

  // Handle icon selection
  const handleSelectIcon = (iconInfo: IconInfo): void => {
    // Update current icon info for color picker
    setCurrentIconInfo(iconInfo);
    
    if (iconInfo.id === 'initial') {
      const svgString = iconToSvgString(iconInfo, selectedColor);
      onIconChange('initial', svgString);
      localStorage.setItem('profileIconId', 'initial');
      localStorage.setItem('profileIcon_initial_color', selectedColor);
    } else {
      // Create a copy of the icon info with the current color
      const updatedIcon = {
        ...iconInfo,
        color: selectedColor
      };
      
      // Save to localStorage for persistence
      localStorage.setItem('profileIconId', updatedIcon.id);
      localStorage.setItem(`profileIcon_${updatedIcon.id}_color`, selectedColor);
      
      // Generate SVG string and pass it to onIconChange
      const svgString = iconToSvgString(updatedIcon, selectedColor);
      onIconChange(updatedIcon.id, svgString);
    }
  };

  // Handle color change
  const handleColorChange = (color: string): void => {
    setSelectedColor(color);
    
    // Update the icon with the new color if an icon is selected
    if (currentIconInfo) {
      const updatedIcon = {
        ...currentIconInfo,
        color: color
      };
      
      // Save color to localStorage
      localStorage.setItem(`profileIcon_${updatedIcon.id}_color`, color);
      
      // Generate SVG string with the new color
      const svgString = iconToSvgString(updatedIcon, color);
      onIconChange(updatedIcon.id, svgString);
    }
  };

  return (
    <div className="relative">
      {/* Simple Dashboard-style Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors w-full text-left"
      >
        Choose Profile Icon
      </button>
      
      {/* Popup */}
      {isOpen && (
        <div 
          ref={popupRef}
          className="absolute top-full mt-2 right-0 z-50 bg-gray-900 rounded-lg shadow-lg"
          style={{ width: '250px' }}
        >
          {/* Header with title */}
          <div className="px-3 py-2 border-b border-gray-800">
            <h3 className="text-white text-base font-medium">Choose Profile Icon</h3>
          </div>
          
          <div className="p-3">
            {/* Compact color selection */}
            <div className="mb-3">
              <span className="text-xs text-gray-400 mb-1.5 block">Icon Color:</span>
              <div className="grid grid-cols-6 gap-1.5">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      selectedColor === color ? 'ring-1 ring-green-400 scale-110' : 'ring-1 ring-gray-700'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
            
            {/* Icons grid - compact and dense */}
            <div className="grid grid-cols-6 gap-1.5">
              {getVisibleIcons().map((iconInfo) => (
                <button
                  key={iconInfo.id}
                  onClick={() => handleSelectIcon(iconInfo)}
                  className={`aspect-square rounded flex items-center justify-center transition-all ${
                    selectedIcon === iconInfo.id 
                      ? 'bg-gray-700 ring-1 ring-green-400' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  title={iconInfo.name}
                >
                  {iconInfo.id === 'initial' ? (
                    <div 
                      className="flex items-center justify-center w-full h-full font-bold" 
                      style={{ color: selectedColor }}
                    >
                      {userInitial || '•'}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full" style={{ color: selectedColor }}>
                      {React.cloneElement(iconInfo.icon as React.ReactElement, { 
                        size: Math.floor(size * 0.7),
                        strokeWidth: 2
                      } as LucideProps)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Compact footer if icon is selected */}
          {currentIconInfo && currentIconInfo.id !== selectedIcon && (
            <div className="px-3 py-1.5 border-t border-gray-800 bg-gray-800/50">
              <span className="text-xs text-green-400">
                Click icon to apply
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
