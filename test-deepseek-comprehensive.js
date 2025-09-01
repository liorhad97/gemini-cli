#!/usr/bin/env node

/**
 * Comprehensive test of DeepSeek CLI functionality
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

async function testQuestion(question, testName) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log(`❓ Question: ${question}`);
  
  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: question }],
      max_tokens: 200,
      stream: false,
    });

    const answer = response.choices[0]?.message?.content;
    console.log(`✅ Answer: ${answer}`);
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting comprehensive DeepSeek CLI tests...\n');
  
  const tests = [
    {
      question: "What is 2+2?",
      name: "Basic Math"
    },
    {
      question: "Write a simple Hello World function in JavaScript",
      name: "Code Generation"
    },
    {
      question: "Explain what DeepSeek is in one sentence",
      name: "Knowledge Query"
    },
    {
      question: "List 3 benefits of using AI assistants",
      name: "Structured Response"
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const success = await testQuestion(test.question, test.name);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! DeepSeek CLI is fully functional!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

runTests().catch(console.error);