import { db, handleFirestoreError, OperationType, collection, getDocs, addDoc } from './firebase';

export async function seedInitialData() {
  const collectionsToCheck = ['small_groups', 'sermons', 'reading_plans', 'devotionals'];
  
  for (const colName of collectionsToCheck) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (snap.empty) {
        console.log(`Seeding ${colName}...`);
        if (colName === 'small_groups') {
          await addDoc(collection(db, 'small_groups'), {
            name: 'Young Adults Bible Study',
            description: 'A place for those in their 20s and 30s to dive deep into the Word and build community.',
            leaderId: 'system',
            leaderName: 'Pastor Sarah',
            members: [],
            meetingTime: 'Tuesdays at 7:00 PM',
            category: 'Bible Study'
          });
          await addDoc(collection(db, 'small_groups'), {
            name: 'Marriage Enrichment',
            description: 'Strengthening relationships through faith-based principles.',
            leaderId: 'system',
            leaderName: 'The Millers',
            members: [],
            meetingTime: 'Every 2nd Saturday',
            category: 'Marriage'
          });
        } else if (colName === 'sermons') {
          await addDoc(collection(db, 'sermons'), {
            title: 'Walking by Faith',
            speaker: 'Pastor Michael Henderson',
            date: '2026-05-10',
            videoUrl: 'https://placeholder.com',
            scriptureRefs: ['Hebrews 11:1', '2 Corinthians 5:7'],
            notes: 'Summary of the faith message.'
          });
        } else if (colName === 'reading_plans') {
          await addDoc(collection(db, 'reading_plans'), {
            title: '30 Days of Grace',
            description: 'A journey through the message of Grace.',
            days: [
              { day: 1, scripture: 'Ephesians 2:8-9' },
              { day: 2, scripture: 'Romans 3:23-24' }
            ],
            participants: {}
          });
        } else if (colName === 'devotionals') {
          await addDoc(collection(db, 'devotionals'), {
            date: new Date().toISOString().split('T')[0],
            title: 'The Still Small Voice',
            content: 'Elijah looked for God in the wind...',
            author: 'Pastor Michael Henderson'
          });
        }
      }
    } catch (error) {
      // Only handle if it's an actual failure, not just checking empty
      handleFirestoreError(error, OperationType.GET, colName);
    }
  }
}
