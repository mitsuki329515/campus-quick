import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";

const canteens = {
  second: {
    name: "学生食堂（2階）",
    shortName: "2階",
    menu: [
      { id: "karaage", name: "から揚げ定食", price: 580, wait: 8, stock: 20, emoji: "🍗", description: "ごはん・味噌汁付き" },
      { id: "curry", name: "ビーフカレー", price: 470, wait: 4, stock: 22, emoji: "🍛", description: "じっくり煮込んだ定番カレー" },
      { id: "chicken-nanban", name: "チキン南蛮定食", price: 600, wait: 9, stock: 15, emoji: "🍱", description: "タルタルソース付き" },
      { id: "keema-curry", name: "キーマカレー", price: 450, wait: 5, stock: 21, emoji: "🍛", description: "スパイス香るひき肉カレー" },
      { id: "ginger-pork", name: "豚の生姜焼き定食", price: 570, wait: 7, stock: 16, emoji: "🍚", description: "ごはん・味噌汁付き" },
      { id: "vegetable-curry", name: "野菜カレー", price: 430, wait: 4, stock: 24, emoji: "🥕", description: "野菜たっぷり" },
    ],
  },
  mezzanine: {
    name: "学生食堂（M2階）",
    shortName: "M2階",
    menu: [
      { id: "shoyu-ramen", name: "醤油ラーメン", price: 480, wait: 7, stock: 16, emoji: "🍜", description: "あっさり鶏ガラスープ" },
      { id: "kitsune-udon", name: "きつねうどん", price: 420, wait: 5, stock: 18, emoji: "🍜", description: "ふっくらお揚げのうどん" },
      { id: "miso-ramen", name: "味噌ラーメン", price: 490, wait: 8, stock: 14, emoji: "🍜", description: "コクのある味噌スープ" },
      { id: "tantan-noodles", name: "担々麺", price: 520, wait: 9, stock: 13, emoji: "🍜", description: "ピリ辛ごまスープ" },
      { id: "soba", name: "山菜そば", price: 430, wait: 5, stock: 17, emoji: "🥢", description: "山菜たっぷり" },
      { id: "shio-ramen", name: "鶏塩ラーメン", price: 480, wait: 6, stock: 11, emoji: "🍜", description: "さっぱり塩味" },
    ],
  },
};

const pickupTimes = ["11:30", "11:45", "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45", "14:00"];

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
  const today = new Date();
  const day = today.getDay();
  const isOpen = day >= 1 && day <= 5;
  const [canteenId, setCanteenId] = useState("second");
  const [cart, setCart] = useState([]);
  const [tab, setTab] = useState("home");
  const [order, setOrder] = useState(null);
  const [notice, setNotice] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const noticeTimer = useRef(null);
  const canteen = canteens[canteenId];
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const maxWait = cart.length ? Math.max(...cart.map((item) => item.wait)) : 0;

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const notify = (message) => {
    clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = setTimeout(() => setNotice(""), 2200);
  };

  const selectCanteen = (id) => {
    if (id === canteenId) return;
    if (cart.length) {
      notify("食堂を切り替えるには、先にカートを空にしてください");
      return;
    }
    setCanteenId(id);
  };

  const add = (item) => {
    const inCart = cart.find((cartItem) => cartItem.id === item.id)?.quantity ?? 0;
    if (inCart >= item.stock) {
      notify("このメニューは本日の販売数に達しています");
      return;
    }
    setCart((currentCart) => {
      const found = currentCart.find((cartItem) => cartItem.id === item.id);
      if (found) {
        return currentCart.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        );
      }
      return [...currentCart, { ...item, quantity: 1 }];
    });
    notify(`${item.name}をカートに追加しました`);
  };

  const changeQuantity = (id, amount) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.min(item.stock, item.quantity + amount) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (id) => setCart((currentCart) => currentCart.filter((item) => item.id !== id));

  const checkout = () => {
    if (!cart.length) return notify("メニューを選んでください");
    if (!pickupTime) return notify("受取時間を選んでください");

    setOrder({
      number: `CQ-${Math.floor(100 + Math.random() * 900)}`,
      canteenName: canteen.name,
      items: cart,
      total,
      pickupTime,
      wait: maxWait,
    });
    setShowCart(false);
    setTab("order");
    setCart([]);
    setPickupTime("");
  };

  return (
    <div className="app-shell">
      <div className="phone">
        <header className="header">
          <div>
            <p className="eyebrow">学食モバイルオーダー</p>
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
              <section className="canteen-section">
                <div className="section-title">
                  <h2>受け取る食堂</h2>
                  <span>食堂ごとに注文</span>
                </div>
                <div className="canteen-tabs" role="tablist" aria-label="食堂を選択">
                  {Object.entries(canteens).map(([id, location]) => (
                    <button
                      aria-pressed={canteenId === id}
                      className={`canteen-tab ${canteenId === id ? "selected" : ""}`}
                      key={id}
                      onClick={() => selectCanteen(id)}
                      type="button"
                    >
                      <MapPin size={16} />
                      {location.name}
                    </button>
                  ))}
                </div>
              </section>

              {canteenId === "second" ? (
                <Card className="crowd-card">
                  <div className="row between start">
                    <div>
                      <p className="muted small inline"><MapPin size={13} />学生食堂（2階）</p>
                      <h2>いまの混雑状況</h2>
                    </div>
                    <span className="status green-soft">すいています</span>
                  </div>
                  <div className="progress"><div className="green" /></div>
                  <div className="row between info-row">
                    <span className="muted">利用率 35%</span>
                    <strong>空席 約78席</strong>
                  </div>
                  <p className="hint">2階食堂の混雑目安です。時間帯により変わります。</p>
                </Card>
              ) : (
                <Card className="crowd-unavailable">
                  <p className="muted small inline"><MapPin size={13} />学生食堂（M2階）</p>
                  <h2>混雑状況は表示していません</h2>
                  <p className="unavailable-note">M2階食堂の様子を確認できないため、メニューと注文のみご利用いただけます。</p>
                </Card>
              )}

              <Card className="date-card">
                <div className="row between">
                  <div>
                    <p className="muted small">本日の営業</p>
                    <h2>{formatDate(today)}</h2>
                  </div>
                  <span className={`status ${isOpen ? "green-soft" : "rose-soft"}`}>
                    {isOpen ? "11:00〜15:00" : "本日は休業"}
                  </span>
                </div>
              </Card>

              <section>
                <div className="section-title">
                  <h2>{canteen.name}のメニュー</h2>
                  <span>{isOpen ? "受取時間を選んで注文" : "本日は休業です"}</span>
                </div>
                {isOpen ? (
                  <div className="menu-grid">
                    {canteen.menu.map((menu) => (
                      <Card className="menu-card" key={menu.id}>
                        <div className="food-visual" aria-hidden="true">{menu.emoji}</div>
                        <h3>{menu.name}</h3>
                        <p className="menu-description">{menu.description}</p>
                        <p className="muted small inline"><Clock3 size={12} />約{menu.wait}分・残り{menu.stock}</p>
                        <div className="row between menu-bottom">
                          <strong>¥{menu.price.toLocaleString("ja-JP")}</strong>
                          <button
                            className="add-button"
                            disabled={!isOpen}
                            onClick={() => add(menu)}
                            aria-label={`${menu.name}をカートに追加`}
                            type="button"
                          >
                            <Plus size={19} />
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card><p className="empty-message">土曜日・日曜日は休業です。</p></Card>
                )}
              </section>
              <p className="prototype-note">※メニュー・在庫・混雑状況はデモ表示です。実際の決済は行われません。</p>
            </>
          )}

          {tab === "order" && (
            <div className="order-page">
              {order ? (
                <>
                  <div className="order-heading">
                    <div className="success-icon"><CheckCircle2 size={34} /></div>
                    <h2>注文を受け付けました</h2>
                    <p>受取時間になったら食堂へお越しください</p>
                  </div>
                  <Card className="order-number">
                    <p>受取番号</p>
                    <strong>{order.number}</strong>
                    <div className="row between order-meta"><span>受取場所</span><b>{order.canteenName}</b></div>
                    <div className="row between order-meta"><span>受取予定</span><b>{order.pickupTime}</b></div>
                    <div className="row between order-meta"><span>調理目安</span><b>約{order.wait}分</b></div>
                  </Card>
                  <Card>
                    <h3 className="inline"><ShoppingBag size={18} />注文内容</h3>
                    <div className="order-list">
                      {order.items.map((item) => (
                        <div className="row between" key={item.id}>
                          <span>{item.emoji} {item.name} × {item.quantity}</span>
                          <strong>¥{(item.price * item.quantity).toLocaleString("ja-JP")}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="row between total-line"><span>合計</span><strong>¥{order.total.toLocaleString("ja-JP")}</strong></div>
                  </Card>
                  <Card>
                    <h3 className="inline"><BellRing size={18} />受け取り方法</h3>
                    <ol className="steps">
                      <li><b>1</b>受取時間に指定した食堂へ</li>
                      <li><b>2</b>受取口で番号を提示</li>
                      <li><b>3</b>商品をお受け取りください</li>
                    </ol>
                  </Card>
                </>
              ) : (
                <Card>
                  <p className="empty-message">現在進行中の注文はありません。</p>
                  <button className="primary" onClick={() => setTab("home")} type="button">メニューを見る</button>
                </Card>
              )}
            </div>
          )}
        </main>

        <nav className="bottom-nav" aria-label="メインメニュー">
          <button onClick={() => setTab("home")} className={tab === "home" ? "active" : ""} type="button">
            <UtensilsCrossed size={21} />メニュー
          </button>
          <button onClick={() => setTab("order")} className={tab === "order" ? "active" : ""} type="button">
            <ShoppingBag size={21} />注文状況
          </button>
        </nav>

        <AnimatePresence>
          {notice && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="toast" role="status">
              {notice}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCart && (
            <motion.div
              className="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
            >
              <motion.div
                className="sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="cart-title"
              >
                <div className="row between">
                  <div>
                    <h2 id="cart-title">注文内容</h2>
                    <p className="cart-canteen">{canteen.name}</p>
                  </div>
                  <button className="plain" onClick={() => setShowCart(false)} aria-label="カートを閉じる" type="button"><X /></button>
                </div>
                {cart.length === 0 ? (
                  <p className="empty-message">商品がありません</p>
                ) : (
                  <>
                    <div className="cart-list">
                      {cart.map((item) => (
                        <div className="cart-item" key={item.id}>
                          <div><b>{item.emoji} {item.name}</b><p>¥{item.price.toLocaleString("ja-JP")} × {item.quantity}</p></div>
                          <div className="quantity-control">
                            <button onClick={() => changeQuantity(item.id, -1)} aria-label={`${item.name}を1つ減らす`} type="button"><Minus size={15} /></button>
                            <span>{item.quantity}</span>
                            <button onClick={() => add(item)} aria-label={`${item.name}を1つ増やす`} type="button"><Plus size={15} /></button>
                            <button className="trash" onClick={() => removeItem(item.id)} aria-label={`${item.name}を削除`} type="button"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <label className="pickup-label">受取時間
                      <select value={pickupTime} onChange={(event) => setPickupTime(event.target.value)}>
                        <option value="">選択してください</option>
                        {pickupTimes.map((time) => <option key={time} value={time}>{time}</option>)}
                      </select>
                    </label>
                    <div className="row between total-line">
                      <span>合計</span>
                      <strong>¥{total.toLocaleString("ja-JP")}</strong>
                    </div>
                    <button className="primary" onClick={checkout} type="button">注文内容を確定する<ChevronRight size={18} /></button>
                    <p className="hint">プロトタイプのため、実際の決済・注文送信は行われません。</p>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
