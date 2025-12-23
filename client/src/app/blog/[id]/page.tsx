'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/landing/Navigation';
import { Calendar, Clock, ArrowLeft, Shield, Tag, Loader2 } from 'lucide-react';
import { getBlogPostById, BlogPostDetail } from '@/lib/blog';

export default function BlogPostPage() {
  const params = useParams();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        const data = await getBlogPostById(params.id as string);
        if (data) {
          setPost(data);
        } else {
          setError('Blog post not found');
        }
      } catch (err) {
        setError('Failed to load blog post');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadPost();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-100">
        <Navigation />
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-black text-gray-100">
        <Navigation />
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <h1 className="text-3xl font-bold text-white mb-4">Blog Post Not Found</h1>
              <p className="text-gray-400 mb-8">{error || "The blog post you're looking for doesn't exist."}</p>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Convert markdown-style content to JSX for display
  const formatContent = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];
    let inList = false;

    lines.forEach((line, index) => {
      // Handle headings
      if (line.startsWith('# ')) {
        if (inList && listItems.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-6 space-y-2">
              {listItems.map((item, i) => (
                <li key={i} className="text-gray-300">{item.replace(/^[-✅]\s*/, '')}</li>
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        elements.push(<h1 key={index} className="text-4xl font-bold text-white mt-12 mb-6 font-heading">{line.substring(2)}</h1>);
        return;
      }
      if (line.startsWith('## ')) {
        if (inList && listItems.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-6 space-y-2">
              {listItems.map((item, i) => (
                <li key={i} className="text-gray-300">{item.replace(/^[-✅]\s*/, '')}</li>
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        elements.push(<h2 key={index} className="text-3xl font-bold text-white mt-10 mb-5 font-heading">{line.substring(3)}</h2>);
        return;
      }
      if (line.startsWith('### ')) {
        if (inList && listItems.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-6 space-y-2">
              {listItems.map((item, i) => (
                <li key={i} className="text-gray-300">{item.replace(/^[-✅]\s*/, '')}</li>
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        elements.push(<h3 key={index} className="text-2xl font-bold text-white mt-8 mb-4 font-heading">{line.substring(4)}</h3>);
        return;
      }
      // Handle lists and checkmarks
      if (line.startsWith('- ') || line.includes('✅')) {
        inList = true;
        listItems.push(line);
        return;
      }
      // Close list if we encounter non-list content
      if (inList && listItems.length > 0 && line.trim()) {
        elements.push(
          <ul key={`list-${index}`} className="list-disc list-inside mb-6 space-y-2">
            {listItems.map((item, i) => (
              <li key={i} className="text-gray-300 flex items-start gap-2">
                {item.includes('✅') && <span>✅</span>}
                <span>{item.replace(/^[-✅]\s*/, '')}</span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      // Handle bold text (lines with **)
      if (line.startsWith('**') && line.endsWith('**')) {
        elements.push(<p key={index} className="text-xl font-semibold text-white my-4">{line.replace(/\*\*/g, '')}</p>);
        return;
      }
      // Regular paragraphs
      if (line.trim()) {
        elements.push(<p key={index} className="text-gray-300 leading-relaxed mb-4">{line}</p>);
        return;
      }
      // Empty lines - add spacing
      if (!inList && elements.length > 0) {
        elements.push(<br key={index} />);
      }
    });

    // Close any remaining list
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key="list-final" className="list-disc list-inside mb-6 space-y-2">
          {listItems.map((item, i) => (
            <li key={i} className="text-gray-300 flex items-start gap-2">
              {item.includes('✅') && <span>✅</span>}
              <span>{item.replace(/^[-✅]\s*/, '')}</span>
            </li>
          ))}
        </ul>
      );
    }

    return elements;
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Navigation />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-12">
            <div className="mb-6">
              <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-400 text-sm font-medium">
                {post.category}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 font-heading leading-tight">
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 mb-8 pb-8 border-b border-dark-accent">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="font-medium text-white">{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(post.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-dark-primary border border-dark-accent rounded-lg text-gray-400 text-sm"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </header>

          {/* Article Content */}
          <article className="prose prose-invert max-w-none">
            <div className="text-gray-300 leading-relaxed text-lg">
              {formatContent(post.content)}
            </div>
          </article>

          {/* Footer Navigation */}
          <div className="mt-16 pt-8 border-t border-dark-accent">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 hover:border-purple-500/50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to All Posts
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
