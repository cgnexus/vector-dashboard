import { db } from './index';
import { apiProviders } from './schema';
import { v4 as uuidv4 } from 'uuid';

const providers = [
  {
    id: uuidv4(),
    name: 'openai',
    displayName: 'OpenAI',
    description: 'OpenAI API for GPT models, embeddings, and more',
    baseUrl: 'https://api.openai.com/v1',
    status: 'active' as const,
  },
  {
    id: uuidv4(),
    name: 'openrouter',
    displayName: 'OpenRouter',
    description: 'Unified API gateway for multiple AI models',
    baseUrl: 'https://openrouter.ai/api/v1',
    status: 'active' as const,
  },
  {
    id: uuidv4(),
    name: 'exa',
    displayName: 'Exa API',
    description: 'Neural search API for web data',
    baseUrl: 'https://api.exa.ai',
    status: 'active' as const,
  },
  {
    id: uuidv4(),
    name: 'twilio',
    displayName: 'Twilio',
    description: 'Communication API for SMS, voice, and email',
    baseUrl: 'https://api.twilio.com',
    status: 'active' as const,
  },
  {
    id: uuidv4(),
    name: 'apollo',
    displayName: 'Apollo',
    description: 'Lead generation and sales intelligence platform',
    baseUrl: 'https://api.apollo.io/v1',
    status: 'active' as const,
  },
];

async function seed() {
  console.log('🌱 Seeding database...');
  
  try {
    // Clear existing providers
    await db.delete(apiProviders);
    
    // Insert new providers
    for (const provider of providers) {
      await db.insert(apiProviders).values(provider);
      console.log(`✅ Added provider: ${provider.displayName}`);
    }
    
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });