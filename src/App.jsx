import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Armchair,
  BellRing,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Users,
  UtensilsCrossed,
  Wifi,
  X,
} from "lucide-react";

const weeklyMenus = {
  1: [
    { id: 1, name: "日替わり定食", price: 550, wait: 6, stock: 18, emoji: "🍱" },
    { id: 2, name: "鶏塩ラーメン", price: 480, wait: 9, stock: 11, emoji: "🍜" },
    { id: 3, name: "野菜カレー", price: 430, wait: 4, stock: 25, emoji: "🍛" },
    { id: 4, name: "おにぎりセット", price: 320, wait: 2, stock: 30, emoji: "🍙" },
  ],
  2: [
    { id: 5, name: "生姜焼き定食", price: 570, wait: 7, stock: 16, emoji: "🍱" },
    { id: 6, name: "味噌ラーメン", price: 490, wait: 8, stock: 14, emoji: "🍜" },
    { id: 7, name: "キーマカレー", price: 450, wait: 5, stock: 21, emoji: "🍛" },
    { id: 8, name: "サラダボウル", price: 380, wait: 3, stock: 13, emoji: "🥗" },
  ],
  3: [
    { id: 9, name: "唐揚げ定食", price: 580, wait: 8, stock: 20, emoji: "🍗" },
    { id: 10, name: "きつねうどん", price: 420, wait: 5, stock: 18, emoji: "🍜" },
    { id: 11, name: "ビーフカレー", price: 470, wait: 4, stock: 22, emoji: "🍛" },
    { id: 12, name: "おにぎりセット", price: 320, wait: 2, stock: 28, emoji: "🍙" },
  ],
  4: [
    { id: 13, name: "チキン南蛮定食", price: 600, wait: 9, stock: 15, emoji: "🍱" },
    { id: 14, name: "醤油ラーメン", price: 480, wait: 7, stock: 16, emoji: "🍜" },
    { id: 15, name: "野菜カレー", price: 430, wait: 4, stock: 24, emoji: "🍛" },
    { id: 16, name: "サンドセット", price: 390, wait: 3, stock: 19, emoji: "🥪" },
  ],
  5: [
    { id: 17, name: "とんかつ定食", price: 620, wait: 10, stock: 12, emoji: "🍱" },
    { id: 18, name: "担々麺", price: 520, wait: 9, stock: 13, emoji: "🍜" },
    { id: 19, name: "週末カレー", price: 460, wait: 5, stock: 20, emoji: "🍛" },
    { id: 20, name: "フルーツヨーグルト", price: 250, wait: 1, stock: 25, emoji: "🥣" },
  ],
};

const slots = [
  { time: "11:30", level: 24 },
  { time: "12:00", level: 58 },
  { time: "12:30", level: 91 },
  { time: "13:00", level: 72 },
  { time: "13:30", level: 35 },
  { time: "14:00", level: 18 },
];

function congestion(level) {
  if (level < 40) return { label: "すいています", color: "green", soft: "green-soft" };
  if (level < 75) return { label: "やや混雑", color: "amber", soft: "amber-soft" };
  return { label: "混雑", color: "rose", soft: "rose-soft" };
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export default function App() {
  const today = useMemo(() => new Date(), []);
  const day = today.getDay();
  const isOpen = day >= 1 && day <= 5;
  const menus = weeklyMenus[day] ?? [];

  const [cart, setCart] = useState([]);
  const [tab, setTab] = useState("home");
  const [order, setOrder] = useState(null);
  const [seat, setSeat] = useState(null);
  const [notice, setNotice] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const noticeTimer = useRef(null);

  const current = congestion(35);
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const maxWait = cart.length ? Math.max(...cart.map((item) => item.wait)) : 0;

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const notify = (message) => {
    clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = setTimeout(() => setNotice(""), 1900);
  };

  const add = (item) => {
    setCart((currentCart) => {
      const found = currentCart.find((x) => x.id === item.id);
      if (found) {
        if (found.quantity >= item.stock) return currentCart;
        return currentCart.map((x) =>
          x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x
        );
      }
      return [...currentCart, { ...item, quantity: 1 }];
    });
    notify(`${item.name}を追加しました`);
  };

  const changeQuantity = (id, amount) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.min(item.stock, item.quantity + amount) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => setCart((c) => c.filter((x) => x.id !== id));

  const checkout = () => {
    if (!cart.length) return notify("商品を選んでください");
    if (!pickupTime) return notify("受取時間を選んでください");

    const createdOrder = {
      number: `B-${Math.floor(100 + Math.random() * 900)}`,
      items: cart,
      total,
      pickupTime,
      wait: maxWait,
    };
    setOrder(createdOrder);
    setShowCart(false);
    setTab("order");
    setCart([]);
  };

  const claimSeat = () => {
    setSeat("A-18");
    notify("席 A-18 を15分間キープしました");
  };

  return (
    <div className="app-shell">
      <div className="phone">
        <header className="header">
          <div>
            <p className="eyebrow">キャンパス食堂</p>
            <h1>Campus Quick</h1>
          </div>
          <button className="icon-button" onClick={() => setShowCart(true)} aria-label="カートを開く">
            <ShoppingBag size={21} />
            {quantity > 0 && <span className="badge">{quantity}</span>}
          </button>
        </header>

        <main className="content">
          {tab === "home" && (
            <>
              <Card>
                <div className="row between start">
                  <div>
                    <p className="muted small inline"><MapPin size={13} />第1食堂</p>
                    <h2>いまの混雑状況</h2>
                  </div>
                  <span className={`status ${current.soft}`}>{current.label}</span>
                </div>
                <div className="progress"><motion.div initial={{ width: 0 }} animate={{ width: "35%" }} className={current.color} /></div>
                <div className="row between info-row">
                  <span className="inline muted"><Users size={15} />利用率 35%</span>
                  <strong>空席 78席</strong>
                </div>
                <button className="primary" onClick={claimSeat} disabled={!isOpen}>
                  <Armchair size={18} />{seat ? `席 ${seat} を確保中` : "到着後すぐ使う席を確保"}
                </button>
                <button className="secondary" onClick={() => setShowCamera(true)}>
                  <Camera size={18} />食堂のようすを見る
                </button>
                <p className="hint">食堂到着時にQRを読み取り、席を短時間キープする想定です</p>
              </Card>

              <Card>
                <div className="row between">
                  <div>
                    <p className="muted small inline"><CalendarDays size={14} />本日の営業</p>
                    <h2>{formatDate(today)}</h2>
                  </div>
                  <span className={`status ${isOpen ? "green-soft" : "rose-soft"}`}>
                    {isOpen ? "11:00〜15:00" : "休業日"}
                  </span>
                </div>
              </Card>

              <section>
                <div className="section-title"><h2>すいている時間</h2><span>本日の予測</span></div>
                <Card>
                  <div className="chart">
                    {slots.map((slot) => {
                      const c = congestion(slot.level);
                      return (
                        <div className="chart-item" key={slot.time}>
                          <div className="bar-wrap">
                            <motion.div initial={{ height: 0 }} animate={{ height: `${slot.level}%` }} className={`bar ${c.color}`} />
                          </div>
                          <span>{slot.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </section>

              <section>
                <div className="section-title"><h2>今日のメニュー</h2><span>{isOpen ? "受取時間を指定できます" : "本日は休業です"}</span></div>
                {isOpen ? (
                  <div className="menu-grid">
                    {menus.map((menu) => (
                      <Card className="menu-card" key={menu.id}>
                        <div className="food-visual">{menu.emoji}</div>
                        <h3>{menu.name}</h3>
                        <p className="muted small inline"><Clock3 size={12} />約{menu.wait}分・残り{menu.stock}</p>
                        <div className="row between menu-bottom">
                          <strong>¥{menu.price}</strong>
                          <button className="add-button" onClick={() => add(menu)} aria-label={`${menu.name}を追加`}><Plus size={19} /></button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card><p className="empty-message">土曜日・日曜日は休業です。</p></Card>
                )}
              </section>
            </>
          )}

          {tab === "order" && (
            <div className="order-page">
              {order ? (
                <>
                  <div className="order-heading">
                    <div className="success-icon"><CheckCircle2 size={34} /></div>
                    <h2>注文を受け付けました</h2>
                    <p>完成したらスマホに通知します</p>
                  </div>
                  <Card className="order-number">
                    <p>受取番号</p>
                    <strong>{order.number}</strong>
                    <div className="row between order-meta"><span>受取予定</span><b>{order.pickupTime}</b></div>
                    <div className="row between order-meta"><span>予想待ち時間</span><b>約{order.wait}分</b></div>
                  </Card>
                  <Card>
                    <h3 className="inline"><ShoppingBag size={18} />注文内容</h3>
                    <div className="order-list">
                      {order.items.map((item) => (
                        <div className="row between" key={item.id}><span>{item.emoji} {item.name} × {item.quantity}</span><strong>¥{item.price * item.quantity}</strong></div>
                      ))}
                    </div>
                    <div className="row between total-line"><span>合計</span><strong>¥{order.total}</strong></div>
                  </Card>
                  <Card>
                    <h3 className="inline"><BellRing size={18} />受け取りの流れ</h3>
                    <ol className="steps"><li><b>1</b>完成通知を待つ</li><li><b>2</b>専用受取口で番号を見せる</li><li><b>3</b>商品を受け取る</li></ol>
                  </Card>
                </>
              ) : (
                <Card><p className="empty-message">現在進行中の注文はありません。</p><button className="primary" onClick={() => setTab("home")}>メニューを見る</button></Card>
              )}
            </div>
          )}
        </main>

        <nav className="bottom-nav">
          <button onClick={() => setTab("home")} className={tab === "home" ? "active" : ""}><UtensilsCrossed size={21} />ホーム</button>
          <button onClick={() => setTab("order")} className={tab === "order" ? "active" : ""}><ShoppingBag size={21} />注文状況</button>
        </nav>

        <AnimatePresence>
          {notice && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="toast">{notice}</motion.div>}
        </AnimatePresence>

        <AnimatePresence>
          {showCart && (
            <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCart(false)}>
              <motion.div className="sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={(e) => e.stopPropagation()}>
                <div className="row between"><h2>注文内容</h2><button className="plain" onClick={() => setShowCart(false)}><X /></button></div>
                {cart.length === 0 ? <p className="empty-message">商品がありません</p> : (
                  <>
                    <div className="cart-list">
                      {cart.map((item) => (
                        <div className="cart-item" key={item.id}>
                          <div><b>{item.emoji} {item.name}</b><p>¥{item.price} × {item.quantity}</p></div>
                          <div className="quantity-control">
                            <button onClick={() => changeQuantity(item.id, -1)}><Minus size={15} /></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)}><Plus size={15} /></button>
                            <button className="trash" onClick={() => removeItem(item.id)}><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <label className="pickup-label">受取時間
                      <select value={pickupTime} onChange={(e) => setPickupTime(e.target.value)}>
                        <option value="">選択してください</option>
                        {slots.filter((s) => s.level < 90).map((s) => <option key={s.time} value={s.time}>{s.time}（{congestion(s.level).label}）</option>)}
                      </select>
                    </label>
                    <div className="row between total-line"><span>合計</span><strong>¥{total}</strong></div>
                    <button className="primary" onClick={checkout}>注文を確定する<ChevronRight size={18} /></button>
                    <p className="hint">これはプロトタイプです。実際の決済は行われません。</p>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCamera && (
            <motion.div className="camera-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="row between camera-header"><div><p>IoT LIVE STREAM</p><h2>第1食堂</h2></div><button className="icon-button" onClick={() => setShowCamera(false)}><X /></button></div>
              <div className="camera-view">
                <div className="grid-lines" />
                <Camera size={46} />
                <span className="live"><i />LIVE</span>
                <div className="camera-stats"><div className="row between"><span>検出人数</span><strong>42人</strong></div><div className="dark-progress"><div /></div></div>
              </div>
              <div className="camera-info">
                <div><ShieldCheck /><span><b>プライバシー保護モード</b><small>人物を特定しない人数データだけを表示</small></span></div>
                <div><Wifi /><span><b>Raspberry Pi Camera 01</b><small>映像解析結果をIoT APIへ送信する想定</small></span></div>
                <p>この画面はプロトタイプです。本番ではカメラ映像を公開せず、人数カウント結果のみを利用する設計を推奨します。</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
