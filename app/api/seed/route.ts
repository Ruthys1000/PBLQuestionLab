import { NextResponse } from 'next/server'
import { prisma, ensureTable } from '@/lib/db'

export const dynamic = 'force-dynamic'

const EXAMPLES = [
  {
    topic: 'מהגרים ופליטים',
    grade: 'י–יב',
    subjects: JSON.stringify(['אזרחות', 'גיאוגרפיה', 'ספרות']),
    question: 'מה חובתה של חברה שרוצה להיות צודקת כלפי מי שמגיעים אליה בלי לבחור בכך?',
    overall_score: 8.4,
    full_data: JSON.stringify({
      id: 'seed-1',
      question: 'מה חובתה של חברה שרוצה להיות צודקת כלפי מי שמגיעים אליה בלי לבחור בכך?',
      why_it_works: 'השאלה מעמידה במתח ערכים יסודיים — ריבונות, שייכות, צדק וסולידריות — ומחייבת את התלמידים לנסח עמדה מנומקת על בסיס עדות, נתון ועיקרון מוסרי.',
      strengths: ['מתח ערכי אמיתי ללא תשובה חד-משמעית', 'קשר לאירועים עכשוויים ורלוונטיים', 'פותחת לחקירה רב-תחומית'],
      weaknesses: ['עשויה להיות טעונה רגשית ולדרוש הכוונת מורה', 'מחייבת בשלות אמוציונלית'],
      sub_questions: ['מהו ההבדל בין פליט למהגר מבחינה משפטית ומוסרית?', 'אילו זכויות יש לאדם רק מפני שהוא אדם?', 'כיצד מאזנות מדינות שונות בין ביטחון לאנושיות?'],
      product_ideas: ['קמפיין מדיניות קליטה מוצעת לכנסת', 'תערוכת סיפורי חיים של פליטים', 'דיון מדומה באו"ם'],
      alternative_formulations: [
        { question: 'מדוע גבולות שנבנו לפני מאה שנה קובעים גורלות של אנשים היום?', explanation: 'מדגישה את מרכזיות המבנה הגיאו-פוליטי' },
        { question: 'מה הופך זר לשכן, ושכן לאזרח?', explanation: 'מיקרו יותר, מתחיל מהאנושי' }
      ],
      stress_test: {
        open_ended: { score: 9, explanation: 'אין תשובה נכונה אחת' },
        content_connection: { score: 8, explanation: 'קשר ישיר לאזרחות, גיאוגרפיה והיסטוריה' },
        authenticity: { score: 9, explanation: 'שאלה שמדינות, ארגוני זכויות אדם ומשפטנים מתמודדים איתה' },
        age_appropriate: { score: 8, explanation: 'מתאים לתלמידי תיכון עם גיוס רגשי נכון' },
        tension_dilemma: { score: 9, explanation: 'ריבונות מול הומניזם — דילמה אמיתית' },
        interdisciplinary: { score: 8, explanation: 'אזרחות, גיאוגרפיה, ספרות, אתיקה' },
        independent_inquiry: { score: 8, explanation: 'דורשת מחקר, ראיות, ניתוח' },
        meaningful_product: { score: 8, explanation: 'ניתן לייצר מסמך מדיניות, תערוכה, דיון' },
        information_available: { score: 9, explanation: 'שפע מקורות ונתונים זמינים' },
        not_googleable: { score: 9, explanation: 'השאלה ערכית — אין תשובה לגגל' },
        overall_score: 8.5
      }
    }),
  },
  {
    topic: 'אוכל ובריאות',
    grade: 'ז–ט',
    subjects: JSON.stringify(['ביולוגיה', 'כלכלה', 'מדעי הסביבה']),
    question: 'כיצד יכולים בני נוער בשכונה אחת לשנות את מה שאנשים אוכלים בה?',
    overall_score: 7.9,
    full_data: JSON.stringify({
      id: 'seed-2',
      question: 'כיצד יכולים בני נוער בשכונה אחת לשנות את מה שאנשים אוכלים בה?',
      why_it_works: 'השאלה מקומית, בת-השגה ומחוברת לחיי היומיום של התלמידים. היא מניחה שינוי אפשרי ומאתגרת אותם לבחון מנגנוני השפעה אמיתיים.',
      strengths: ['קרובה לעולם התלמיד', 'ברת-ביצוע עם תוצר קהילתי אמיתי', 'מחברת ביולוגיה לכלכלה לרווחה חברתית'],
      weaknesses: ['עלולה להישאר ברמת "קמפיין מודעות" ללא עומק', 'צריך לדאוג לחקירה של גורמי מבנה ולא רק גורמי בחירה'],
      sub_questions: ['מה גורם לאנשים לאכול מה שהם אוכלים — בחירה חופשית או נסיבות?', 'מהי "מדבר מזון" ואיך הוא מתפתח?', 'אילו שינויים קטנים בסביבה משפיעים על התנהגות אכילה?'],
      product_ideas: ['מפת מזון של השכונה עם המלצות', 'פרויקט גינה קהילתית', 'תכנית פעולה לבית ספר'],
      alternative_formulations: [
        { question: 'מדוע ילדים עניים אוכלים פחות בריא מילדים עשירים, ומה ניתן לעשות בנידון?', explanation: 'מדגישה את זווית אי-השוויון' },
        { question: 'מה מחיר "ארוחת הג\'אנק" האמיתי — לי, לקהילה ולסביבה?', explanation: 'נכנסת מזווית עלות-תועלת' }
      ],
      stress_test: {
        open_ended: { score: 8, explanation: 'פתוחה לאסטרטגיות שונות' },
        content_connection: { score: 8, explanation: 'ביולוגיה תזונתית, כלכלת מזון, אקולוגיה' },
        authenticity: { score: 8, explanation: 'ארגוני בריאות ועיריות מתמודדים עם שאלה זו' },
        age_appropriate: { score: 9, explanation: 'מושלם לגיל חטיבת ביניים' },
        tension_dilemma: { score: 7, explanation: 'בחירה אישית מול גורמי מבנה' },
        interdisciplinary: { score: 8, explanation: 'ביולוגיה, כלכלה, סוציולוגיה, סביבה' },
        independent_inquiry: { score: 8, explanation: 'ממפים, סוקרים, מנתחים' },
        meaningful_product: { score: 9, explanation: 'תוצר קהילתי אמיתי' },
        information_available: { score: 8, explanation: 'נתוני בריאות ומזון זמינים' },
        not_googleable: { score: 7, explanation: 'השאלה המקומית לא ניתנת לגוגל' },
        overall_score: 8.0
      }
    }),
  },
  {
    topic: 'מגיפות ובריאות הציבור',
    grade: 'י–יב',
    subjects: JSON.stringify(['ביולוגיה', 'היסטוריה', 'אתיקה']),
    question: 'מתי זכותה של מדינה להגביל את חירות הפרט בשם בריאות הציבור — ומי מחליט?',
    overall_score: 9.1,
    full_data: JSON.stringify({
      id: 'seed-3',
      question: 'מתי זכותה של מדינה להגביל את חירות הפרט בשם בריאות הציבור — ומי מחליט?',
      why_it_works: 'השאלה נולדה מניסיון חי של התלמידים (קורונה) ומחברת בין ביולוגיה, אתיקה פוליטית ועקרונות חוקתיים. היא אינה ניתנת לפתרון ע"י גוגל ומחייבת בניית עמדה.',
      strengths: ['רלוונטית ביותר לדור שחווה סגרים', 'מחברת מדע ופוליטיקה ואתיקה', 'יש עליה ויכוח אמיתי בין מומחים'],
      weaknesses: ['דורשת הבחנה ברורה בין ביקורת לגיטימית לתיאוריות קונספירציה', 'מחייבת מורה בעל/ת בשלות להכיל מגוון דעות'],
      sub_questions: ['מהי "חירות" ומה הגבולות שלה בחברה?', 'כיצד מדינות שונות קיבלו החלטות שונות באותה מגיפה?', 'מי נפגע יותר ממגיפות — ומדוע?'],
      product_ideas: ['פרוטוקול פעולה למגיפה עתידית', 'תצוגת נתונים השוואתית', 'דיון מדומה בבית המשפט'],
      alternative_formulations: [
        { question: 'למה מגיפות פוגעות תמיד בחלשים יותר, וכיצד ניתן לשנות זאת?', explanation: 'מדגישה את זווית אי-השוויון הבריאותי' },
        { question: 'כיצד היינו מנהלים את מגיפת הקורונה אחרת, לו ידענו אז מה שאנו יודעים היום?', explanation: 'נכנסת מזווית רפלקציה ולמידה מניסיון' }
      ],
      stress_test: {
        open_ended: { score: 10, explanation: 'ויכוח פילוסופי ממשי ללא הכרעה' },
        content_connection: { score: 9, explanation: 'ביולוגיה של מגיפות, אתיקה, מדינאות' },
        authenticity: { score: 10, explanation: 'שאלה שממשלות, בתי משפט ומומחים נאבקים בה' },
        age_appropriate: { score: 8, explanation: 'דורש בשלות אבל רלוונטי מאוד לתיכון' },
        tension_dilemma: { score: 10, explanation: 'חירות מול ביטחון קולקטיבי — הדילמה הקלאסית' },
        interdisciplinary: { score: 9, explanation: 'ביולוגיה, היסטוריה, אתיקה, משפט, כלכלה' },
        independent_inquiry: { score: 9, explanation: 'דורש מחקר, ניתוח, בניית טיעון' },
        meaningful_product: { score: 9, explanation: 'פרוטוקול, פסיקה, ניתוח השוואתי' },
        information_available: { score: 9, explanation: 'שפע מידע על קורונה וגריפה ספרדית' },
        not_googleable: { score: 9, explanation: 'השאלה הנורמטיבית לא ניתנת לגוגל' },
        overall_score: 9.2
      }
    }),
  },
]

export async function GET() {
  if (!prisma) {
    return NextResponse.json({ error: 'אין חיבור לDB — DATABASE_URL לא מוגדר' }, { status: 503 })
  }

  try {
    await ensureTable()
    const existing = await prisma.archivedQuestion.count()
    if (existing > 0) {
      return NextResponse.json({ message: `הארכיון כבר מכיל ${existing} שאלות — לא נוספו דוגמאות.` })
    }

    await prisma.archivedQuestion.createMany({ data: EXAMPLES })
    return NextResponse.json({ message: `נוספו ${EXAMPLES.length} שאלות דוגמה לארכיון.` })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `שגיאת DB: ${message}` }, { status: 500 })
  }
}
