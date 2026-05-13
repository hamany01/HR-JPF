
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seedJob() {
  try {
    const jobData = {
      title: "مدير موارد بشرية (HR Manager)",
      department: "إدارة الموارد البشرية",
      description: "نحن نبحث عن مدير موارد بشرية ذو خبرة لقيادة فريقنا وتطوير استراتيجيات الموارد البشرية التي تدعم أهداف العمل العامة. ستكون مسؤولاً عن التوظيف والتدريب والتعويضات والمزايا وعلاقات الموظفين.",
      requirements: "خبرة لا تقل عن 5 سنوات في إدارة الموارد البشرية. شهادة جامعية في إدارة الأعمال أو الموارد البشرية. إجادة اللغتين العربية والإنجليزية. مهارات قيادية وتواصل ممتازة.",
      criteria: [
        "الخبرة المهنية",
        "المهارات القيادية",
        "الثقافة التنظيمية",
        "حل النزاعات",
        "التخطيط الاستراتيجي"
      ],
      questions: [
        "ما هي أكبر التحديات التي واجهتها كمدير موارد بشرية وكيف تعاملت معها؟",
        "كيف تضمن بقاء الشركة ممتثلة لقوانين العمل المحلية؟",
        "صف استراتيجيتك لتحسين الاحتفاظ بالموظفين (Employee Retention).",
        "كيف تتعامل مع تقييمات الأداء السنوية لضمان الإنصاف والفعالية؟"
      ],
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'jobs'), jobData);
    console.log("Job added with ID: ", docRef.id);
    process.exit(0);
  } catch (e) {
    console.error("Error adding document: ", e);
    process.exit(1);
  }
}

seedJob();
