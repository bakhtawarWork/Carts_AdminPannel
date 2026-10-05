import type { FilterCategory } from "@/lib/types";

/** Master filter catalog — swap for API when available. */
export const FILTER_CATALOG: FilterCategory[] = [
  {
    id: "61f7a5791f398f63e66c39d4",
    name: { en: "Gatherings", ar: "تجمعات" },
    subTypes: [
      { id: "61f7a5791f398f63e66c39d5", name: { en: "Grills 2", ar: "مشاوي" } },
      { id: "61f7a5791f398f63e66c39d6", name: { en: "Sushi", ar: "سوشي" } },
      {
        id: "61f7a6111f398f63e66c3a67",
        name: { en: "Uncooked Burger", ar: "برجر غير مطهو" },
      },
      {
        id: "61f7aa6a1f398f63e66c3b73",
        name: { en: "Fresh Juices", ar: "عصائر طازجة" },
      },
      { id: "61f7aa6a1f398f63e66c3b74", name: { en: "Fruits", ar: "فواكة" } },
      {
        id: "61f7aca61f398f63e66c3c24",
        name: { en: "Seafood", ar: "مأكولات بحرية" },
      },
    ],
  },
  {
    id: "5fae8033df259c5d3b2aaa01",
    name: { en: "Carts", ar: "عربات" },
    subTypes: [
      {
        id: "5fae8033df259c5d3b2aaa02",
        name: { en: "Less than 1000 QR", ar: "اقل من ١٠٠٠ ريال" },
      },
    ],
  },
  {
    id: "5fae7f3fdf259c5d3b2aa9f8",
    name: { en: "Special", ar: "مميز" },
    subTypes: [
      { id: "5fae7f3fdf259c5d3b2aa9f9", name: { en: "Discount", ar: "الخصومات" } },
    ],
  },
  {
    id: "61f7a4b21f398f63e66c399c",
    name: { en: "For Occasions", ar: "للمناسبات" },
    subTypes: [
      { id: "61f7a4b21f398f63e66c399d", name: { en: "Flowers", ar: "زهور" } },
      {
        id: "61f7a4ea1f398f63e66c399f",
        name: { en: "Chocolates", ar: "شوكلاته" },
      },
      {
        id: "61f7a4ea1f398f63e66c39a0",
        name: { en: "Sandwiches", ar: "ساندويشات" },
      },
      {
        id: "61f7a4ea1f398f63e66c39a1",
        name: { en: "Occasions Setup", ar: "إعداد المناسبات" },
      },
      { id: "61f7a5181f398f63e66c39bc", name: { en: "Cakes", ar: "كيك" } },
      { id: "61f7a5181f398f63e66c39bd", name: { en: "Desserts", ar: "حلويات" } },
      {
        id: "61f7a6571f398f63e66c3ab0",
        name: { en: "Hospitality", ar: "ضيافة" },
      },
      { id: "61f7a9c91f398f63e66c3b17", name: { en: "Sacrifices", ar: "ذبائح" } },
    ],
  },
  {
    id: "5fae7fb7df259c5d3b2aa9fd",
    name: { en: "Buffets", ar: "بوفيهات" },
    subTypes: [
      {
        id: "5fae7fb7df259c5d3b2aa9fe",
        name: { en: "Less than 1000 QR", ar: "اقل من ١٠٠٠ ريال" },
      },
      { id: "5fb525e387dd1f5816284ea3", name: { en: "Qatari", ar: "المآكولات القطرية" } },
      { id: "5fb79169dce0ec11121ff2a8", name: { en: "Arabic", ar: "المآكولات العربية" } },
      {
        id: "5fb79169dce0ec11121ff2a9",
        name: { en: "Intercontinental", ar: "المآكولات العالمية" },
      },
      { id: "5fb79169dce0ec11121ff2aa", name: { en: "Indian", ar: "المآكولات الهندية" } },
      { id: "5fb79169dce0ec11121ff2ab", name: { en: "Persian", ar: "المآكولات الايرانية" } },
      { id: "5fb79169dce0ec11121ff2ac", name: { en: "Italian", ar: "المآكولات الايطالية" } },
      { id: "5fb79169dce0ec11121ff2ad", name: { en: "Lebanese", ar: "المآكولات اللبنانية" } },
      { id: "5fb79169dce0ec11121ff2ae", name: { en: "Breakfast", ar: "الفطور" } },
      { id: "5fb79169dce0ec11121ff2af", name: { en: "Asian", ar: "المآكولات الاسيوية" } },
      { id: "5fb79169dce0ec11121ff2b0", name: { en: "Western", ar: "المآكولات الغربية" } },
    ],
  },
  {
    id: "5fba64a9c610f20d99fb83aa",
    name: { en: "Kids", ar: "اطفال" },
    subTypes: [
      {
        id: "5fba64a9c610f20d99fb83ab",
        name: { en: "Decoration Cookies", ar: "تزيين الكوكيز" },
      },
      {
        id: "5fba64a9c610f20d99fb83ac",
        name: { en: "Decoration Cupcakes", ar: "تزيين الكب كيك" },
      },
      {
        id: "5fba650ec610f20d99fb83b0",
        name: { en: "Cookies Cart", ar: "عربة الكوكيز" },
      },
      {
        id: "5fba650ec610f20d99fb83b1",
        name: { en: "Cupcakes Cart", ar: "عربة الكيك" },
      },
    ],
  },
  {
    id: "5fba688bc610f20d99fb840b",
    name: { en: "others", ar: "اخرى" },
    subTypes: [
      {
        id: "5fba688bc610f20d99fb840c",
        name: { en: "Afternoon Tea", ar: "افترنون تي" },
      },
    ],
  },
  {
    id: "5fae7f8bdf259c5d3b2aa9fb",
    name: { en: "Stations", ar: "استيشنات" },
    subTypes: [
      {
        id: "5fae7f8bdf259c5d3b2aa9fc",
        name: { en: "Less than 1000 QR", ar: "اقل من ١٠٠٠ ريال" },
      },
      { id: "5fb0277adf259c5d3b2ab838", name: { en: "Shawarma", ar: "الشاورما" } },
      { id: "5fb0277adf259c5d3b2ab839", name: { en: "Saj & Regag", ar: "الصاج والرقاق" } },
      {
        id: "5fb0277adf259c5d3b2ab83a",
        name: { en: "Ice Cream & Frozan Yogurt", ar: "الايس كريم المثلج" },
      },
      {
        id: "5fb029d9df259c5d3b2ab855",
        name: { en: "Burger & Slider", ar: "برجر سلايدر" },
      },
      { id: "5fb029d9df259c5d3b2ab856", name: { en: "Pizza", ar: "البيتزا" } },
      { id: "5fb029d9df259c5d3b2ab857", name: { en: "Fatayer", ar: "الفطائر" } },
      { id: "5fb029d9df259c5d3b2ab858", name: { en: "Dessert", ar: "الحلويات" } },
      { id: "5fb029d9df259c5d3b2ab859", name: { en: "Coffee", ar: "القهوة" } },
      { id: "5fb029d9df259c5d3b2ab85a", name: { en: "Kunafa", ar: "الكنافة" } },
      { id: "5fb029d9df259c5d3b2ab85b", name: { en: "Asian", ar: "المأكولات الاسيوية" } },
      { id: "5fb029d9df259c5d3b2ab85c", name: { en: "Grills", ar: "المشويات" } },
      { id: "5fb029d9df259c5d3b2ab85d", name: { en: "Indian", ar: "المأكولات الهندية" } },
      { id: "5fb029d9df259c5d3b2ab85e", name: { en: "Pasta", ar: "الباستا" } },
      { id: "5fb029d9df259c5d3b2ab85f", name: { en: "Sandwich", ar: "الساندويشات" } },
      {
        id: "5fb029d9df259c5d3b2ab860",
        name: { en: "Beverage & juices", ar: "المشروبات والعصائر" },
      },
      { id: "5fb029d9df259c5d3b2ab861", name: { en: "Turkish", ar: "المأكولات التركية" } },
      {
        id: "5fb029d9df259c5d3b2ab862",
        name: { en: "Waffle, Pancake & Crepe", ar: "وافل وبان كيك 🧇" },
      },
      { id: "5fb029d9df259c5d3b2ab863", name: { en: "Kids", ar: "للاطفال" } },
      { id: "5fb029d9df259c5d3b2ab864", name: { en: "Salads", ar: "السلطات" } },
      {
        id: "5fb029d9df259c5d3b2ab865",
        name: { en: "Khaliji cuisine", ar: "مأكولات خليج" },
      },
      { id: "5fb029d9df259c5d3b2ab866", name: { en: "Mexican", ar: "الماكولات المكسيكية" } },
      { id: "5fb029d9df259c5d3b2ab867", name: { en: "Breakfast", ar: "الفطور" } },
      {
        id: "5fba61fec610f20d99fb835e",
        name: { en: "Uncooked Burger", ar: "برجر غير مطهو" },
      },
      {
        id: "5fba6409c610f20d99fb83a8",
        name: { en: "Baby Reception", ar: "استقبال الأطفال" },
      },
      {
        id: "5fba6409c610f20d99fb83a9",
        name: { en: "Fruit & Juices", ar: "فواكة و عصائر" },
      },
      {
        id: "5fbb545ac610f20d99fb8744",
        name: { en: "Mojito & Juices", ar: "موهيتو و عصائر" },
      },
      { id: "5fbb545ac610f20d99fb8745", name: { en: "Chocolate", ar: "شوكلاتة" } },
      {
        id: "5fbb54a7c610f20d99fb8762",
        name: { en: "Cold Appetizer", ar: "مقبلات باردة" },
      },
      {
        id: "5fbb54a7c610f20d99fb8763",
        name: { en: "Hot Appetizer", ar: "مقبلات ساخنة" },
      },
      { id: "61f7a3c31f398f63e66c3990", name: { en: "Bubble Tea", ar: "بابل تي" } },
      { id: "61f7a58e1f398f63e66c39f6", name: { en: "Sushi", ar: "سوشي" } },
    ],
  },
  {
    id: "5fba6143c610f20d99fb8341",
    name: { en: "Most Selling", ar: "الاكثر مبيعاً" },
    subTypes: [
      {
        id: "5fba6143c610f20d99fb8342",
        name: { en: "Most Selling Sweets", ar: "الحلويات الأكثر مبيعاً" },
      },
      {
        id: "5fba6143c610f20d99fb8343",
        name: { en: "Most Selling Burgers", ar: "البرجر الأكثر مبيعا" },
      },
      {
        id: "5fba6143c610f20d99fb8344",
        name: { en: "Most Selling Coffees", ar: "أكثر أنواع القهوة مبيعاً" },
      },
    ],
  },
];
