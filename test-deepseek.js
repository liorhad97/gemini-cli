#!/usr/bin/env node

/**
 * Simple test script to verify DeepSeek API integration
 */

// Simple Node.js test without TypeScript compilation
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

class SimpleDeepSeekTest {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.client = null;
  }

  async init() {
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: 'https://api.deepseek.com',
    });
  }

  async testBasicChat() {
    const response = await this.client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: 'Hello! Can you respond with just "DeepSeek API is working!" to confirm the integration?' }
      ],
      max_tokens: 50,
    });

    return response.choices[0]?.message?.content || '';
  }
}

async function testDeepSeekIntegration() {
  console.log('Testing DeepSeek API integration...');
  
  try {
    const test = new SimpleDeepSeekTest();
    await test.init();
    console.log('✅ DeepSeek client initialized successfully');
    
    console.log('📤 Sending test request...');
    const response = await test.testBasicChat();
    console.log('📥 Response received:', response);
    
    console.log('✅ DeepSeek API integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('DEEPSEEK_API_KEY')) {
      console.log('Please set it with: export DEEPSEEK_API_KEY=your_api_key');
    }
    process.exit(1);
  }
}

testDeepSeekIntegration();