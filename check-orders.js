require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkOrders() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const orders = await db.collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    console.log('\n=== RECENT ORDERS STATUS ===\n');
    
    orders.forEach((order, index) => {
      console.log(`${index + 1}. Order: ${order.orderNumber}`);
      console.log(`   📅 Created: ${new Date(order.createdAt).toLocaleString()}`);
      console.log(`   💰 Total: ₹${order.total}`);
      console.log(`   📋 Status: ${order.status}`);
      console.log(`   💳 Payment Status: ${order.paymentStatus}`);
      console.log(`   📧 Email Sent: ${order.confirmationEmailSent ? '✅ Yes' : '❌ No'}`);
      if (order.confirmationEmailSentAt) {
        console.log(`   📧 Email Sent At: ${new Date(order.confirmationEmailSentAt).toLocaleString()}`);
      }
      console.log(`   🔗 Stripe Session: ${order.stripeSessionId || 'N/A'}`);
      console.log(`   🔑 Payment Intent: ${order.paymentIntentId || 'N/A'}`);
      console.log('   ────────────────────────────');
    });
    
    // Count orders by status
    const statusCounts = await db.collection('orders').aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    
    console.log('\n=== ORDER STATUS SUMMARY ===');
    statusCounts.forEach(status => {
      console.log(`${status._id}: ${status.count} orders`);
    });
    
    // Count payment status
    const paymentCounts = await db.collection('orders').aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
    ]).toArray();
    
    console.log('\n=== PAYMENT STATUS SUMMARY ===');
    paymentCounts.forEach(status => {
      console.log(`${status._id}: ${status.count} orders`);
    });
    
    // Count email status
    const emailCounts = await db.collection('orders').aggregate([
      { $group: { 
        _id: '$confirmationEmailSent', 
        count: { $sum: 1 } 
      }}
    ]).toArray();
    
    console.log('\n=== EMAIL STATUS SUMMARY ===');
    emailCounts.forEach(status => {
      console.log(`Email sent (${status._id}): ${status.count} orders`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkOrders();