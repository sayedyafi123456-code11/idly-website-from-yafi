"use client";

import AuthGate from "@/components/auth-gate";

import { useState } from "react";
import { Bell, Compass, Heart, Home, ImagePlus, LockKeyhole, MessageCircle, MoreHorizontal, Plus, Search, Send, ShieldCheck, Sparkles, Users, X } from "lucide-react";

const people: { name: string; handle: string; avatar: string; color: string }[] = [];
const initialPosts: { id: number; name: string; handle: string; time: string; avatar: string; color: string; text: string; tag: string; likes: number; liked: boolean; image: string }[] = [];

export default function HomePage() {
  const [tab, setTab] = useState("Home");
  const [posts, setPosts] = useState(initialPosts);
  const [likedStory, setLikedStory] = useState<number | null>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [postText, setPostText] = useState("");
  const [notice, setNotice] = useState("Demo profiles removed. Real members will appear after secure sign-up is connected.");
  const [query, setQuery] = useState("");

  function addPost() {
    if (!postText.trim()) return;
    setPosts([{ id: Date.now(), name: "You", handle: "@you", time: "just now", avatar: "Y", color: "green", text: postText.trim(), tag: "NEW POST", likes: 0, liked: false, image: "" }, ...posts]);
    setPostText(""); setShowPost(false); setNotice("Preview post added on this device.");
  }
  function toggleLike(id: number) {
    setPosts(current => current.map(post => post.id === id ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) } : post));
  }

  return <AuthGate><main className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark">F</span><span>FERADIOZ<small>YOUR PRIVATE CIRCLE</small></span></a>
      <div className="side-label">MENU</div>
      {[[Home,"Home"],[Compass,"Explore"],[MessageCircle,"Messages"],[Bell,"Notifications"],[Users,"Friends"]].map(([Icon,label]: any) => <button key={label} className={tab===label?"nav-item active":"nav-item"} onClick={()=>setTab(label)}><Icon size={19}/>{label}{label==="Messages"&&<i>2</i>}</button>)}
      <div className="sidebar-bottom">
        <div className="private-card"><div className="private-icon"><LockKeyhole size={17}/></div><b>Private by nature</b><p>Your circle stays yours. Only approved friends belong here.</p><span><ShieldCheck size={13}/> FRIENDS ONLY</span></div>
        <button className="profile-mini" onClick={()=>setTab("Profile")}><div className="avatar green">Y</div><span><b>Your profile</b><small>@you</small></span><MoreHorizontal size={18}/></button>
      </div>
    </aside>

    <section className="main-column">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark">F</span> FERADIOZ</div><div className="search"><Search size={17}/><input placeholder="Search your circle..." value={query} onChange={e=>setQuery(e.target.value)}/></div><button className="icon-button" aria-label="Notifications" onClick={()=>setNotice("You’re all caught up in this preview.")}><Bell size={19}/></button><button className="join-button" onClick={()=>setShowJoin(true)}>Join your circle <Plus size={16}/></button></header>
      <div className="feed-wrap">
        <div className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> THE FRIENDS-ONLY NETWORK</div><h1>Your people.<br/><em>Your place.</em></h1><p>A little corner of the internet, just for your circle.</p></div><div className="welcome-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orb-main">F<span>✳</span></div><div className="orbit-tag">✦ ONLY US</div></div></div>
        <section className="stories-section"><div className="section-heading"><div><h2>Your circle</h2><p>Little updates from your people</p></div><button className="text-button" onClick={()=>setTab("Friends")}>See all <span>↗</span></button></div><div className="stories"><button className="story add-story" onClick={()=>setShowPost(true)}><span className="story-ring add-ring"><Plus size={23}/></span><small>Add yours</small></button>{people.map((p,i)=><button className="story" key={p.name} onClick={()=>setLikedStory(i)}><span className="story-ring"><span className={"avatar "+p.color}>{p.avatar}</span></span><small>{p.name}</small></button>)}</div></section>
        <section className="feed-section"><div className="section-heading"><div><h2>{tab==="Home"?"The latest":tab}</h2><p>Good things happen in good company</p></div><button className="filter-button" onClick={()=>setNotice("Showing posts from your circle.")}>Latest⌄</button></div>
          {posts.filter(p=>(p.name+" "+p.text).toLowerCase().includes(query.toLowerCase())).map(post=><article className="post-card" key={post.id}><div className="post-top"><div className={"avatar "+post.color}>{post.avatar}</div><div className="post-author"><b>{post.name}</b><small>{post.handle} · {post.time}</small></div><button className="dots" aria-label="More"><MoreHorizontal size={20}/></button></div><p className="post-text">{post.text}</p>{post.image&&<div className={"post-image "+post.image}><div className="image-caption">{post.tag}<span>✦</span></div></div>}<div className="post-actions"><button className={post.liked?"liked":""} onClick={()=>toggleLike(post.id)}><Heart size={19} fill={post.liked?"currentColor":"none"}/>{post.likes}</button><button onClick={()=>setNotice("Comments will be available when the member database is connected.")}><MessageCircle size={19}/> Comment</button><button onClick={()=>setNotice("Sharing is coming soon.")}><Send size={18}/></button></div></article>)}
          {posts.length===0&&<div className="post-card empty-state"><div className="modal-symbol"><Users size={20}/></div><b>Your circle starts here</b><p>No demo posts or fake accounts. Once your friends are approved, their real posts will show up here.</p></div>}
          <div className="preview-note"><LockKeyhole size={16}/><span>This is a visual preview. Posts and likes are currently saved only in this browser session.</span></div>
        </section>
      </div>
    </section>
    <aside className="right-column"><div className="right-head"><span>YOUR SPACE</span><span className="tiny-lock"><LockKeyhole size={14}/></span></div><div className="invite-card"><div className="invite-stars">✳</div><span className="eyebrow">SMALL CIRCLE. BIG MEMORIES.</span><h3>Keep it<br/>between us.</h3><p>FERADIOZ is made for your real friends, not the whole internet.</p><button onClick={()=>setShowJoin(true)}>Request to join <span>↗</span></button></div><div className="online-head"><h3>Your people</h3><span>{people.length} FRIENDS</span></div>{people.length===0?<p className="no-friends">No approved friends yet.</p>:people.map(p=><div className="person-row" key={p.name}><div className={"avatar small "+p.color}>{p.avatar}</div><div><b>{p.name}</b><small>{p.handle}</small></div><span className="online-dot"/></div>)}<div className="right-footer"><ShieldCheck size={15}/> A PRIVATE SPACE FOR YOUR CREW</div></aside>
    {notice&&<div className="toast" onClick={()=>setNotice("")}>{notice}<button aria-label="Close"><X size={14}/></button></div>}
    {showJoin&&<div className="modal-backdrop" onClick={()=>setShowJoin(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowJoin(false)}><X/></button><div className="modal-symbol"><LockKeyhole/></div><span className="eyebrow">FRIENDS ONLY</span><h2>Find your people.</h2><p>FERADIOZ is a private circle. Send a join request and the owner can approve you.</p><input placeholder="Your name" /><input placeholder="Your username" /><button className="primary-wide" onClick={()=>{setShowJoin(false);setNotice("Join requests will work after the secure member system is connected.")}}>Send join request <Send size={16}/></button><small className="modal-foot">No public sign-ups. Every member is approved.</small></div></div>}
    {showPost&&<div className="modal-backdrop" onClick={()=>setShowPost(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowPost(false)}><X/></button><div className="modal-symbol"><ImagePlus/></div><span className="eyebrow">SHARE A MOMENT</span><h2>What’s happening?</h2><textarea value={postText} onChange={e=>setPostText(e.target.value)} placeholder="Share something with your circle..." /><button className="primary-wide" onClick={addPost}>Post to your circle <Send size={16}/></button></div></div>}
    {likedStory!==null&&people[likedStory]&&<div className="modal-backdrop" onClick={()=>setLikedStory(null)}><div className="story-modal" onClick={e=>e.stopPropagation()}><button className="modal-close light-close" onClick={()=>setLikedStory(null)}><X/></button><div className={"avatar "+people[likedStory].color}>{people[likedStory].avatar}</div><h2>{people[likedStory].name}’s story</h2><p>Stories from your friends will appear here.</p><button className="primary-wide" onClick={()=>setLikedStory(null)}>Close story</button></div></div>}
  </main></AuthGate>;
}
