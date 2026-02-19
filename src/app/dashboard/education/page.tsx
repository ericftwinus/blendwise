"use client";

import { Video, Play, Clock, BookOpen, Award } from "lucide-react";

const videos = [
  {
    id: 1,
    title: "Introduction to Blenderized Tube Feedings",
    description: "Learn the basics of BTF — what it is, who it's for, and how it can improve your quality of life.",
    duration: "12 min",
    category: "Getting Started",
    thumbnail: "🎬",
  },
  {
    id: 2,
    title: "Choosing the Right Blender for BTF",
    description: "A guide to selecting the best blender for tube feedings, including Vitamix, Ninja, and NutriBullet comparisons.",
    duration: "8 min",
    category: "Equipment",
    thumbnail: "🔧",
  },
  {
    id: 3,
    title: "Food Safety for Tube Feedings",
    description: "Essential food safety practices — proper storage, handling, temperature control, and shelf life.",
    duration: "15 min",
    category: "Safety",
    thumbnail: "🛡️",
  },
  {
    id: 4,
    title: "Blending Techniques for Smooth Consistency",
    description: "How to achieve the right texture to prevent tube clogging while maximizing nutrient density.",
    duration: "10 min",
    category: "Techniques",
    thumbnail: "⚡",
  },
  {
    id: 5,
    title: "Managing GI Symptoms with BTF",
    description: "How to adjust your blends when experiencing nausea, diarrhea, constipation, or other GI issues.",
    duration: "14 min",
    category: "Symptom Management",
    thumbnail: "💊",
  },
  {
    id: 6,
    title: "Transitioning from Commercial Formula to BTF",
    description: "A safe, step-by-step guide to gradually introducing blenderized feedings into your routine.",
    duration: "18 min",
    category: "Getting Started",
    thumbnail: "🔄",
  },
  {
    id: 7,
    title: "Meal Prep & Batch Cooking for BTF",
    description: "Save time with batch preparation — make a week's worth of blends in one session.",
    duration: "20 min",
    category: "Techniques",
    thumbnail: "📦",
  },
  {
    id: 8,
    title: "Understanding Your Nutrient Targets",
    description: "What your ENN means and how to ensure your blends meet your calorie, protein, and micronutrient goals.",
    duration: "11 min",
    category: "Nutrition",
    thumbnail: "📊",
  },
  {
    id: 9,
    title: "Family Meal Integration",
    description: "How to create blends inspired by family meals — eat together, stay connected.",
    duration: "13 min",
    category: "Lifestyle",
    thumbnail: "👨‍👩‍👧‍👦",
  },
];

const categories = Array.from(new Set(videos.map((v) => v.category)));

export default function EducationPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Video className="w-6 h-6 text-brand-600" />
          Educational Library
        </h1>
        <p className="text-gray-500 mt-1">
          Expert-created videos and resources on blenderized tube feedings, food safety, blending techniques, and more.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Videos</p>
            <p className="text-lg font-semibold text-gray-900">{videos.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-lg font-semibold text-gray-900">0 / {videos.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Duration</p>
            <p className="text-lg font-semibold text-gray-900">~2 hours</p>
          </div>
        </div>
      </div>

      {/* Videos by category */}
      {categories.map((category) => (
        <div key={category}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos
              .filter((v) => v.category === category)
              .map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition cursor-pointer group"
                >
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-36 flex items-center justify-center relative">
                    <span className="text-4xl">{video.thumbnail}</span>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg">
                        <Play className="w-5 h-5 text-brand-600 ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">
                        {video.category}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {video.duration}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-brand-600 transition">
                      {video.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {video.description}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
