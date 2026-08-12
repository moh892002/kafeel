import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Card, { CardHeader } from "@/components/ui/Card";
import PageState from '@/components/ui/PageState'
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/Icon"
import FormError from '@/components/ui/FormError'
import Notice from '@/components/ui/Notice'
;
import PageHeader from "@/components/ui/PageHeader";
import { Input, Textarea } from "@/components/ui/Input";
import Switch from "@/components/ui/Switch";
import { api } from "@/app/api";
import { useAuth } from "@/features/auth/useAuth";

const TABS = [
  { key: "account", label: "الحساب", icon: "user" },
  { key: "security", label: "الأمان", icon: "shield" },
  { key: "prefs", label: "الإشعارات", icon: "bell" },
];

const ACCOUNT_DEFAULTS = {
  name: "", // filled from the auth session (see below) — never a hardcoded admin name
  email: "admin@kafeel.sa",
  phone: "0550000000",
  bio: "مدير منصة كفيل — متابعة العمليات اليومية للمنصة والأخصائيين.",
};

const PREFS_DEFAULTS = {
  booking: true,
  payment: true,
  review: true,
  email: true,
  sms: false,
};

const str = (map, key, fallback) =>
  map[key] === undefined || map[key] === null ? fallback : map[key];
const bool = (map, key, fallback) =>
  map[key] === undefined ? fallback : map[key] === "true";

const field = (setter) => (key) => (e) =>
  setter((prev) => ({ ...prev, [key]: e.target.value }));
const toggle = (setter) => (key) => () =>
  setter((prev) => ({ ...prev, [key]: !prev[key] }));

const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "الآن";
  if (min < 60) return `قبل ${min} د`;
  const h = Math.floor(min / 60);
  if (h < 24) return `قبل ${h} س`;
  const d = Math.floor(h / 24);
  return `قبل ${d} يوم`;
};

export default function Profile() {
  const { admin, updateProfile } = useAuth();
  const defaultName = admin?.name ?? "المدير";
  const [tab, setTab] = useState("account");
  const [account, setAccount] = useState(ACCOUNT_DEFAULTS);
  const [prefs, setPrefs] = useState(PREFS_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passError, setPassError] = useState(null);
  const [passBusy, setPassBusy] = useState(false);
  const [twoFa, setTwoFa] = useState(true);
  const [notice, setNotice] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsError, setSessionsError] = useState(null);
  const [terminating, setTerminating] = useState(null);
  // Last-persisted identity — only the admin endpoint (which rotates the JWT)
  // is called when name or email actually changed.
  const persistedIdentity = useRef(null);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    let cancelled = false;
    api
      .settings()
      .then((map) => {
        if (cancelled) return;
        const s = map ?? {};
        const loaded = {
          name: str(s, "profile.name", defaultName),
          email: str(s, "profile.email", ACCOUNT_DEFAULTS.email),
          phone: str(s, "profile.phone", ACCOUNT_DEFAULTS.phone),
          bio: str(s, "profile.bio", ACCOUNT_DEFAULTS.bio),
        };
        setAccount(loaded);
        persistedIdentity.current = { name: loaded.name, email: loaded.email };
        setPrefs({
          booking: bool(
            s,
            "profileNotifications.booking",
            PREFS_DEFAULTS.booking,
          ),
          payment: bool(
            s,
            "profileNotifications.payment",
            PREFS_DEFAULTS.payment,
          ),
          review: bool(s, "profileNotifications.review", PREFS_DEFAULTS.review),
          email: bool(s, "profileNotifications.email", PREFS_DEFAULTS.email),
          sms: bool(s, "profileNotifications.sms", PREFS_DEFAULTS.sms),
        });
        setTwoFa(bool(s, "security.twoFa", true));
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [defaultName]);

  // Login sessions are secondary — a failure must not block the page.
  useEffect(() => {
    let cancelled = false;
    api
      .loginSessions()
      .then((list) => {
        if (!cancelled) setSessions(list ?? []);
      })
      .catch(() => {
        if (!cancelled) setSessionsError("تعذر تحميل الجلسات");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveAccount = async () => {
    setSaving(true);
    try {
      // The real identity lives in the admin account (topbar/sidebar/login).
      // Only touch it when name or email actually changed — a phone/bio-only
      // edit must not rotate the JWT.
      const prev = persistedIdentity.current;
      if (!prev || prev.name !== account.name || prev.email !== account.email) {
        await updateProfile(account.name, account.email);
        persistedIdentity.current = { name: account.name, email: account.email };
      }
      // Phone + bio (and a mirror of name/email) live in the settings store,
      // which is what this page reloads from on next visit.
      const values = Object.fromEntries(
        Object.entries(account).map(([k, v]) => [`profile.${k}`, String(v)]),
      );
      await api.updateSettings(values);
      setNotice({ text: "تم حفظ بيانات الحساب بنجاح ✓", tone: "success" });
    } catch (e) {
      setNotice({ text: e.message, tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const savePrefs = async () => {
    setSaving(true);
    const values = Object.fromEntries(
      Object.entries(prefs).map(([k, v]) => [
        `profileNotifications.${k}`,
        String(v),
      ]),
    );
    try {
      await api.updateSettings(values);
      setNotice({ text: "تم حفظ التفضيلات بنجاح ✓", tone: "success" });
    } catch (e) {
      setNotice({ text: e.message, tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const setPass = (key) => (e) => {
    setPasswords((p) => ({ ...p, [key]: e.target.value }));
    setPassError(null);
  };

  const changePassword = async () => {
    if (!passwords.current) {
      setPassError("يرجى إدخال كلمة المرور الحالية");
      return;
    }
    if (passwords.next.length < 8) {
      setPassError("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPassError("كلمتا المرور غير متطابقتين");
      return;
    }
    setPassBusy(true);
    try {
      await api.changePassword(passwords.current, passwords.next);
      setPasswords({ current: "", next: "", confirm: "" });
      setNotice({ text: "تم تغيير كلمة المرور بنجاح ✓", tone: "success" });
    } catch (e) {
      setPassError(e.message);
    } finally {
      setPassBusy(false);
    }
  };

  const terminate = async (id) => {
    setTerminating(id);
    try {
      await api.terminateSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setNotice({ text: "تم إنهاء الجلسة بنجاح ✓", tone: "success" });
    } catch (e) {
      setNotice({ text: e.message, tone: "error" });
    } finally {
      setTerminating(null);
    }
  };

  const toggleTwoFa = async () => {
    const next = !twoFa;
    setTwoFa(next);
    try {
      await api.updateSettings({ "security.twoFa": String(next) });
      setNotice({
        text: next
          ? "تم تفعيل المصادقة الثنائية ✓"
          : "تم إيقاف المصادقة الثنائية",
        tone: "success",
      });
    } catch (e) {
      setTwoFa(!next); // revert on failure
      setNotice({ text: e.message, tone: "error" });
    }
  };

  if (error) {
    return (
      <PageState
        mode="error"
        title="تعذر تحميل بيانات الحساب"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (loading) {
    return (
      <PageState
        mode="loading"
        label="جاري تحميل الحساب الشخصي..."
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header + tabs */}
      <PageHeader
        title="الحساب الشخصي"
        subtitle="إدارة بيانات حسابك وكلمة المرور وتفضيلات الإشعارات"
      />

      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-line bg-card p-1.5 shadow-card">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              tab === t.key
                ? "bg-primary text-white shadow-[0_4px_12px_rgba(7,94,102,0.35)]"
                : "text-ink-soft hover:bg-mint hover:text-primary"
            }`}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Notice */}
      {notice && <Notice text={notice.text} tone={notice.tone} onDismiss={() => setNotice(null)} />}

      {/* Account tab */}
      {tab === "account" && (
        <>
          <Card className="overflow-hidden">
            <div className="relative h-24 bg-gradient-to-l from-primary via-primary-soft to-accent-soft">
              <div className="absolute -start-8 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
            </div>
            <div className="relative px-5 pb-5">
              <div className="-mt-11 flex flex-wrap items-end gap-4">
                <Avatar
                  name={account.name}
                  size={88}
                  rounded="rounded-2xl"
                  className="border-4 border-white shadow-pop"
                />
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-ink">
                      {account.name}
                    </h3>
                    <Badge tone="soft" icon="check" className="text-white">
                      موثق
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-ink-soft">
                    مدير المنصة
                  </p>
                  <p className="mt-0.5 text-xs text-ink-mute">
                    {account.email}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="البيانات الشخصية"
              subtitle="البيانات المعروضة في حسابك"
            />
            <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2">
              <Input
                label="الاسم الكامل"
                id="pr-name"
                value={account.name}
                onChange={field(setAccount)("name")}
              />
              <Input
                label="البريد الإلكتروني"
                id="pr-email"
                type="email"
                value={account.email}
                onChange={field(setAccount)("email")}
              />
              <Input
                label="رقم الجوال"
                id="pr-phone"
                value={account.phone}
                onChange={field(setAccount)("phone")}
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="نبذة تعريفية"
                  id="pr-bio"
                  rows={3}
                  value={account.bio}
                  onChange={field(setAccount)("bio")}
                />
              </div>
            </div>
            <div className="flex justify-end border-t border-line px-5 py-3.5">
              <Button
                icon={<Icon name="check" size={16} />}
                onClick={saveAccount}
                disabled={saving}
              >
                {saving ? "جارٍ الحفظ..." : "حفظ البيانات"}
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Security tab */}
      {tab === "security" && (
        <>
          <Card>
            <CardHeader
              title="تغيير كلمة المرور"
              subtitle="استخدم كلمة مرور قوية لا تقل عن 8 أحرف"
            />
            <div className="space-y-4 px-5 pb-5">
              {passError && <FormError rounded="xl">{passError}</FormError>}
              <Input
                label="كلمة المرور الحالية"
                id="pw-current"
                type="password"
                icon="lock"
                value={passwords.current}
                onChange={setPass("current")}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="كلمة المرور الجديدة"
                  id="pw-new"
                  type="password"
                  icon="key"
                  value={passwords.next}
                  onChange={setPass("next")}
                />
                <Input
                  label="تأكيد كلمة المرور"
                  id="pw-confirm"
                  type="password"
                  icon="key"
                  value={passwords.confirm}
                  onChange={setPass("confirm")}
                />
              </div>
            </div>
            <div className="flex justify-end border-t border-line px-5 py-3.5">
              <Button
                icon={<Icon name="shield" size={16} />}
                onClick={changePassword}
                disabled={passBusy}
              >
                {passBusy ? "جارٍ التغيير..." : "تغيير كلمة المرور"}
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="المصادقة الثنائية"
              subtitle="حماية إضافية عند تسجيل الدخول"
            />
            <div className="border-t border-line">
              <Switch
                checked={twoFa}
                onChange={toggleTwoFa}
                label="تفعيل المصادقة الثنائية (2FA)"
                description="تفضيل محفوظ — سيتم تفعيل رمز التحقق عند كل تسجيل دخول في مرحلة لاحقة"
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="جلسات تسجيل الدخول"
              subtitle="الأجهزة التي تم تسجيل الدخول منها حالياً"
            />
            {sessionsError ? (
              <p className="border-t border-line px-5 py-4 text-xs font-bold text-red-500">
                {sessionsError}
              </p>
            ) : sessions.length === 0 ? (
              <p className="border-t border-line px-5 py-4 text-sm font-semibold text-ink-mute">
                لا توجد جلسات مسجلة بعد
              </p>
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {sessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-primary">
                        <Icon
                          name={
                            /iPhone|Android|iOS/i.test(s.device)
                              ? "phone"
                              : "home"
                          }
                          size={18}
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-bold text-ink">
                          <span className="truncate">{s.device}</span>
                          {s.current && (
                            <Badge tone="success" compact>
                              الجلسة الحالية
                            </Badge>
                          )}
                          {!s.active && (
                            <Badge tone="neutral" compact>
                              منتهية
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-ink-mute">
                          {s.location || s.ip} · {timeAgo(s.lastActive)}
                        </p>
                      </div>
                    </div>
                    {!s.current && s.active && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={terminating === s.id}
                        onClick={() => terminate(s.id)}
                      >
                        {terminating === s.id
                          ? "جارٍ الإنهاء..."
                          : "إنهاء الجلسة"}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {/* Preferences tab */}
      {tab === "prefs" && (
        <Card>
          <CardHeader
            title="تفضيلات الإشعارات"
            subtitle="اختر الأحداث التي تريد تلقي إشعارات عنها"
          />
          <div className="divide-y divide-line border-t border-line">
            {[
              ["booking", "حجز جلسة جديد", "عند إنشاء حجز جديد"],
              ["payment", "عملية دفع", "عند اكتمال أو استرداد عملية دفع"],
              ["review", "تقييم جديد", "عند إضافة تقييم أو تعليق"],
            ].map(([key, label, desc]) => (
              <Switch
                key={key}
                checked={prefs[key]}
                onChange={toggle(setPrefs)(key)}
                label={label}
                description={desc}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 border-t border-line px-3 py-3 sm:grid-cols-2">
            {[
              ["email", "البريد الإلكتروني"],
              ["sms", "رسائل SMS"],
            ].map(([key, label]) => (
              <Switch
                key={key}
                checked={prefs[key]}
                onChange={toggle(setPrefs)(key)}
                label={label}
              />
            ))}
          </div>
          <div className="flex justify-end border-t border-line px-5 py-3.5">
            <Button
              icon={<Icon name="check" size={16} />}
              onClick={savePrefs}
              disabled={saving}
            >
              {saving ? "جارٍ الحفظ..." : "حفظ التفضيلات"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
