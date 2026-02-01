// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCzuKiRXKAM-kdptBB1lJd8F_80vTAwZ3s",
  authDomain: "fairtoon-campaign.firebaseapp.com",
  projectId: "fairtoon-campaign",
  storageBucket: "fairtoon-campaign.firebasestorage.app",
  messagingSenderId: "292189493430",
  appId: "1:292189493430:web:609896e78b4f3138e3ee17",
  measurementId: "G-JX82SRD98Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Calculator, 
  BarChart3, 
  Video, 
  PenTool, 
  Users, 
  MapPin, 
  School,
  AlertTriangle,
  Award,
  Share2,
  ChevronRight,
  Send
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'fairtoon-campaign';

const App = () => {
  const [user, setUser] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  
  // Calculator State
  const [viewCount, setViewCount] = useState(0);
  const [avgPrice, setAvgPrice] = useState(300); // 회당 평균 가격 (캐시 등)
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    region: '서울',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth failed:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Real-time Data Sync
  useEffect(() => {
    if (!user) return;

    const sigRef = collection(db, 'artifacts', appId, 'public', 'data', 'signatures');
    const msgRef = collection(db, 'artifacts', appId, 'public', 'data', 'messages');

    const unsubSig = onSnapshot(sigRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSignatures(data);
    }, (err) => console.error(err));

    const unsubMsg = onSnapshot(msgRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    }, (err) => console.error(err));

    return () => {
      unsubSig();
      unsubMsg();
    };
  }, [user]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = signatures.length;
    const regionStats = signatures.reduce((acc, curr) => {
      acc[curr.region] = (acc[curr.region] || 0) + 1;
      return acc;
    }, {});
    const schoolStats = signatures.reduce((acc, curr) => {
      acc[curr.school] = (acc[curr.school] || 0) + 1;
      return acc;
    }, {});
    
    return { total, regionStats, schoolStats };
  }, [signatures]);

  const handleSignature = async (e) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const sigRef = collection(db, 'artifacts', appId, 'public', 'data', 'signatures');
      const msgRef = collection(db, 'artifacts', appId, 'public', 'data', 'messages');

      await addDoc(sigRef, {
        name: formData.name,
        school: formData.school,
        region: formData.region,
        timestamp: serverTimestamp()
      });

      if (formData.message) {
        await addDoc(msgRef, {
          name: formData.name,
          text: formData.message,
          timestamp: serverTimestamp()
        });
      }

      setFormData({ name: '', school: '', region: '서울', message: '' });
      alert("서명이 완료되었습니다! 작가님들을 지켜주셔서 감사합니다.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedDamage = viewCount * avgPrice;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl text-blue-600">
            <Heart fill="currentColor" className="text-pink-500" />
            <span>Fairtoon</span>
          </div>
          <div className="hidden md:flex gap-6 font-medium text-slate-600">
            <button onClick={() => setActiveTab('calc')} className="hover:text-blue-600">피해 계산기</button>
            <button onClick={() => setActiveTab('info')} className="hover:text-blue-600">피해 현황</button>
            <button onClick={() => setActiveTab('video')} className="hover:text-blue-600">작가 인터뷰</button>
            <button onClick={() => setActiveTab('sign')} className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition">서명하기</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            우리가 사랑하는 웹툰,<br />우리가 직접 지켜요!
          </h1>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            불법 유통 사이트 이용은 작가님의 꿈을 뺏는 일입니다.<br />
            정당한 대가를 지불하고 더 멋진 작품을 응원해주세요.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm px-6 py-4 rounded-2xl flex items-center gap-3">
              <Users className="w-8 h-8" />
              <div className="text-left">
                <p className="text-sm opacity-80">현재 참여 인원</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}명</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-6 py-4 rounded-2xl flex items-center gap-3">
              <Award className="w-8 h-8 text-yellow-300" />
              <div className="text-left">
                <p className="text-sm opacity-80">최다 참여 학교</p>
                <p className="text-2xl font-bold">
                  {Object.entries(stats.schoolStats).sort((a,b) => b[1]-a[1])[0]?.[0] || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16 space-y-24">
        
        {/* 1. 피해 계산기 */}
        <section id="calc" className="scroll-mt-20">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full">
                <Calculator size={18} />
                <span>Webtoon Damage Calculator</span>
              </div>
              <h2 className="text-3xl font-bold">나의 습관이 미치는 영향은?</h2>
              <p className="text-slate-600 leading-relaxed">
                한 달 동안 불법 사이트에서 본 웹툰의 회차를 입력해보세요.<br />
                그 행동이 작가님에게 어떤 손실을 주는지 확인해 봅시다.
              </p>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">한 달간 불법 시청 회차</span>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={viewCount}
                    onChange={(e) => setViewCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer mt-2"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>0회</span>
                    <span className="text-blue-600 font-bold text-lg">{viewCount}회</span>
                    <span>100회</span>
                  </div>
                </label>
              </div>
            </div>
            <div className="flex-1 w-full bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <AlertTriangle className="text-red-500" />
                예상 피해액 리포트
              </h3>
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b pb-4">
                  <span className="text-slate-500">직접적인 매출 손실</span>
                  <span className="text-2xl font-bold text-red-500">₩{calculatedDamage.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-end border-b pb-4">
                  <span className="text-slate-500">작가 창작 의욕 감소</span>
                  <span className="text-2xl font-bold text-slate-700">심각</span>
                </div>
                <p className="text-sm text-slate-400">
                  * 위 금액은 단순 유료 회차 가격을 기준으로 한 최소 금액이며, 2차 창작물 기회 비용 등을 포함하면 수십 배 더 큽니다.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl text-slate-600 text-sm">
                  "여러분의 작은 관심이 작가님에겐 큰 힘이 됩니다. 지금 정식 사이트로 이동해볼까요?"
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. 인포그래픽 */}
        <section id="info" className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">웹툰 시장의 아픈 현실</h2>
            <p className="text-slate-500">숫자로 보는 불법 유통의 심각성</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: '불법 유통 시장 규모', value: '8,427억원', color: 'text-red-500', desc: '정식 시장의 약 절반 수준' },
              { label: '작가 평균 수익 감소', value: '32%', color: 'text-orange-500', desc: '불법 유통 사이트 활성화 이후' },
              { label: '연간 창작 포기 작가', value: '1,200명+', color: 'text-slate-600', desc: '수익 저하로 차기작 준비 포기' }
            ].map((item, idx) => (
              <div key={idx} className="text-center p-6 border border-slate-50 rounded-2xl hover:bg-slate-50 transition">
                <p className="text-sm text-slate-500 mb-2">{item.label}</p>
                <p className={`text-3xl font-extrabold mb-2 ${item.color}`}>{item.value}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. 작가 인터뷰 */}
        <section id="video" className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">작가님들의 진솔한 목소리</h2>
            <p className="text-slate-500">불법 사이트가 그들의 삶에 미치는 영향</p>
          </div>
          <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl bg-slate-200 flex items-center justify-center group relative cursor-pointer">
            {/* Mock YouTube Iframe */}
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center group-hover:bg-slate-900/20 transition">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition">
                <Video size={40} fill="currentColor" />
              </div>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1200" 
              alt="Interview thumbnail" 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-6 left-6 text-white text-left">
              <p className="font-bold text-xl">"제 꿈이 도둑맞는 기분이었어요"</p>
              <p className="opacity-80">인기 웹툰 'Fair툰' A작가님 인터뷰</p>
            </div>
          </div>
        </section>

        {/* 4. 이용 근절 서명 & 메시지 보드 */}
        <section id="sign" className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-blue-600 p-10 rounded-3xl text-white">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <PenTool />
              클린 유저 서명하기
            </h2>
            <p className="mb-8 opacity-90 leading-relaxed">
              "나는 앞으로 웹툰 불법 유통 사이트를 이용하지 않겠습니다. 정당한 대가를 지불하고 정식 사이트에서만 웹툰을 즐길 것을 약속합니다."
            </p>
            <form onSubmit={handleSignature} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input 
                  required
                  placeholder="이름 (또는 닉네임)" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:bg-white focus:text-slate-900 outline-none transition"
                />
                <input 
                  required
                  placeholder="학교명" 
                  value={formData.school}
                  onChange={e => setFormData({...formData, school: e.target.value})}
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:bg-white focus:text-slate-900 outline-none transition"
                />
              </div>
              <select 
                value={formData.region}
                onChange={e => setFormData({...formData, region: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:bg-white focus:text-slate-900 outline-none transition"
              >
                <option value="서울">서울</option>
                <option value="경기">경기</option>
                <option value="강원">강원</option>
                <option value="충청">충청</option>
                <option value="전라">전라</option>
                <option value="경상">경상</option>
                <option value="제주">제주</option>
              </select>
              <textarea 
                placeholder="작가님께 전하는 한마디 (선택)" 
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:bg-white focus:text-slate-900 outline-none transition resize-none"
              />
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-white text-blue-600 font-bold py-4 rounded-xl hover:bg-yellow-300 hover:text-slate-900 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? "처리 중..." : "서명하고 약속하기"}
                <ChevronRight size={20} />
              </button>
            </form>
          </div>

          <div className="flex flex-col">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Send className="text-blue-600" />
              실시간 응원 한마디
            </h3>
            <div className="flex-1 bg-slate-100 rounded-3xl p-6 overflow-y-auto max-h-[500px] space-y-4">
              {messages.length > 0 ? messages.map((m, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm">{m.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm">{m.text}</p>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Heart className="opacity-20" size={48} />
                  <p>첫 번째 응원 메시지를 남겨주세요!</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 5. 서명 현황 */}
        <section id="stats" className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">서명 참여 현황</h2>
            <p className="text-slate-500">전국에서 동참하고 있는 클린 유저들</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h4 className="font-bold mb-6 flex items-center gap-2">
                <MapPin className="text-blue-600" />
                지역별 참여
              </h4>
              <div className="space-y-4">
                {Object.entries(stats.regionStats).sort((a,b) => b[1]-a[1]).map(([region, count]) => (
                  <div key={region} className="flex items-center gap-4">
                    <span className="w-12 text-sm font-medium">{region}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold">{count}명</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h4 className="font-bold mb-6 flex items-center gap-2 text-pink-600">
                <School />
                참여 리더보드 (학교)
              </h4>
              <div className="space-y-4">
                {Object.entries(stats.schoolStats).sort((a,b) => b[1]-a[1]).slice(0, 5).map(([school, count], idx) => (
                  <div key={school} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-yellow-400 text-white' : 'bg-slate-300 text-slate-600'}`}>
                        {idx + 1}
                      </span>
                      <span className="font-medium">{school}</span>
                    </div>
                    <span className="font-bold text-blue-600">{count}명</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 font-bold text-2xl mb-4">
              <Heart fill="currentColor" className="text-pink-500" />
              <span>Fairtoon</span>
            </div>
            <p className="text-slate-400 text-sm">
              본 캠페인은 웹툰 불법 유통 근절을 통해<br />
              대한민국 웹툰 산업의 밝은 미래를 응원합니다.
            </p>
          </div>
          <div className="flex gap-4">
            <button className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition">
              <Share2 size={24} />
            </button>
            <button className="bg-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition">
              공식 웹툰 사이트로 가기
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-slate-500 text-xs">
          © 2024 Fairtoon Campaign. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default App;