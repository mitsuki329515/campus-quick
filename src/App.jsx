import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  QrCode,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";

const canteens = {
  second: {
    name: "学生食堂（2階）",
    shortName: "2階",
    businessHours: [
      { label: "昼営業", start: "11:00", end: "14:00" },
      { label: "夜営業", start: "15:00", end: "20:00" },
    ],
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
    businessHours: [{ label: "昼営業", start: "11:00", end: "14:00" }],
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

const paymentMethods = [
  { id: "code", label: "コード決済", Icon: QrCode },
  { id: "card", label: "カード", Icon: CreditCard },
];

function getPickupTimes(businessHours) {
  return businessHours.flatMap(({ label, start, end }) => {
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    const times = [];

    for (let minutes = startTime; minutes < endTime; minutes += 15) {
      const hour = Math.floor(minutes / 60).toString().padStart(2, "0");
      const minute = (minutes % 60).toString().padStart(2, "0");
      times.push({ value: `${hour}:${minute}`, label });
    }

    return times;
  });
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
  const today = new Date();
  const day = today.getDay();
  const isOpen = day >= 1 && day <= 5;
  const [canteenId, setCanteenId] = useState("second");
  const [cart, setCart] = useState([]);
  const [tab, setTab] = useState("home");
  const [order, setOrder] = useState(null);
  const [notice, setNotice] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const noticeTimer = useRef(null);
  const canteen = canteens[canteenId];
  const availablePickupTimes = getPickupTimes(canteen.businessHours);
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
    setPickupTime("");
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
    if (!pickupTime) {
      setCheckoutError("受取時間を選択してください");
      return;
    }
    if (!paymentMethod) {
      setCheckoutError("支払方法を選択してください");
      return;
    }
    setCheckoutError("");

    setOrder({
      number: `CQ-${Math.floor(100 + Math.random() * 900)}`,
      canteenName: canteen.name,
      items: cart,
      total,
      pickupTime,
      paymentMethod: paymentMethods.find((method) => method.id === paymentMethod).label,
      wait: maxWait,
    });
    setShowCart(false);
    setTab("order");
    setCart([]);
    setPickupTime("");
    setPaymentMethod("");
  };

  return (
    <div className="app-shell">
      <div className="phone">
        <header className="header">
          <div>
            <p className="eyebrow">学食モバイルオーダー</p>
            <h1>Campus Quick</h1>
          </div>
          <button className="icon-button" onClick={() => { setNotice(""); setCheckoutError(""); setShowCart(true); }} aria-label="カートを開く">
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
                    <p className="muted small">営業時間（月〜金）</p>
                    <h2>{formatDate(today)}</h2>
                  </div>
                  <div className="business-hours">
                    {isOpen ? canteen.businessHours.map((hours) => (
                      <span className="status green-soft" key={hours.label}>
                        {hours.label} {hours.start}〜{hours.end}
                      </span>
                    )) : <span className="status rose-soft">本日は休業</span>}
                  </div>
                </div>
              </Card>

              <section>
                <div className="section-title">
                  <h2>{canteen.name}のメニュー</h2>
                  <span>{isOpen ? "受取時間を選んで注文" : "本日は休業です"}</span>
                </div>
                {isOpen ? (
                  <div className="menu-grid">
                    {canteen.menu.map((menu) => {
                      const menuQuantity = cart.find((item) => item.id === menu.id)?.quantity ?? 0;
                      return (
                        <Card className="menu-card" key={menu.id}>
                          <div className="food-visual" aria-hidden="true">{menu.emoji}</div>
                          <h3>{menu.name}</h3>
                          <p className="menu-description">{menu.description}</p>
                          <p className="muted small inline"><Clock3 size={12} />約{menu.wait}分・残り{menu.stock}</p>
                          <div className="row between menu-bottom">
                            <strong>¥{menu.price.toLocaleString("ja-JP")}</strong>
                            <motion.button
                              className="add-button"
                              disabled={!isOpen}
                              onClick={() => add(menu)}
                              aria-label={`${menu.name}をカートに追加${menuQuantity ? `（現在${menuQuantity}個）` : ""}`}
                              whileTap={{ scale: 0.88 }}
                              type="button"
                            >
                              <Plus size={19} />
                              {menuQuantity > 0 && <span className="add-count">{menuQuantity}</span>}
                            </motion.button>
                          </div>
                        </Card>
                      );
                    })}
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
                    <div className="row between order-meta"><span>支払方法</span><b>{order.paymentMethod}</b></div>
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
                initial={{ y: 0 }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="cart-title"
              >
                <div className="sheet-header row between">
                  <div>
                    <h2 id="cart-title">注文内容の確認</h2>
                    <p className="cart-canteen">{canteen.name}</p>
                  </div>
                  <button className="plain" onClick={() => setShowCart(false)} aria-label="カートを閉じる" type="button"><X /></button>
                </div>
                <div className="sheet-content">
                  {cart.length === 0 ? (
                    <p className="empty-message">商品がありません</p>
                  ) : (
                    <>
                      <section className="confirmation-section" aria-label="注文する商品">
                        <h3>注文する商品 <span>{quantity}点</span></h3>
                        <div className="cart-list">
                          {cart.map((item) => (
                            <div className="cart-item" key={item.id}>
                              <div className="cart-item-info">
                                <b>{item.emoji} {item.name}</b>
                                <p>¥{item.price.toLocaleString("ja-JP")} × {item.quantity}</p>
                              </div>
                              <strong className="cart-item-subtotal">¥{(item.price * item.quantity).toLocaleString("ja-JP")}</strong>
                              <div className="quantity-control">
                                <button onClick={() => changeQuantity(item.id, -1)} aria-label={`${item.name}を1つ減らす`} type="button"><Minus size={15} /></button>
                                <span>{item.quantity}</span>
                                <button onClick={() => add(item)} aria-label={`${item.name}を1つ増やす`} type="button"><Plus size={15} /></button>
                                <button className="trash" onClick={() => removeItem(item.id)} aria-label={`${item.name}を削除`} type="button"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                      <section className="confirmation-section">
                        <h3>受取時間</h3>
                        <p className="section-hint">営業中の時間から選択してください（15分ごと）</p>
                        <label className="pickup-label">
                          <span className="visually-hidden">受取時間を選択</span>
                          <select value={pickupTime} onChange={(event) => { setPickupTime(event.target.value); setCheckoutError(""); }}>
                            <option value="">時間を選択してください</option>
                            {availablePickupTimes.map(({ value, label }) => (
                              <option key={value} value={value}>{value}（{label}）</option>
                            ))}
                          </select>
                        </label>
                      </section>
                      <fieldset className="confirmation-section payment-options">
                        <legend>支払方法</legend>
                        <div className="payment-method-list">
                          {paymentMethods.map(({ id, label, Icon }) => (
                            <label className={`payment-method${paymentMethod === id ? " selected" : ""}`} key={id}>
                              <input
                                type="radio"
                                name="payment-method"
                                value={id}
                                checked={paymentMethod === id}
                                onChange={() => { setPaymentMethod(id); setCheckoutError(""); }}
                              />
                              <Icon size={20} />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </>
                  )}
                </div>
                {cart.length > 0 && (
                  <div className="sheet-footer">
                    <div className="row between total-line">
                      <span>お支払い合計</span>
                      <strong>¥{total.toLocaleString("ja-JP")}</strong>
                    </div>
                    {checkoutError && <p className="checkout-error" role="alert">{checkoutError}</p>}
                    <button className="primary" onClick={checkout} type="button">内容を確認して注文する<ChevronRight size={18} /></button>
                    <p className="hint">デモのため、決済・注文送信は行われません。</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
