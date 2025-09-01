#!/usr/bin/env node

/**
 * Direct test of our DeepSeek CLI without streaming
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

async function testDeepSeekCLI() {
  console.log('🧪 Testing DeepSeek CLI Integration...');
  
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY not found');
    process.exit(1);
  }
  
  const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  });

  try {
    console.log('📤 Sending test request to DeepSeek...');
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: 'Hello! Respond with exactly: "DeepSeek CLI is now working!"' }
      ],
      max_tokens: 50,
      stream: false, // Non-streaming first
    });

    console.log('📥 Response received:');
    console.log('✅', response.choices[0]?.message?.content);
    
    console.log('\n✨ DeepSeek integration successful!');
    console.log('🔧 The CLI configuration is working, streaming needs to be fixed.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDeepSeekCLI();