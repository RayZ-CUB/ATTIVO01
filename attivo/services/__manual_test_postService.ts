/**
 * Manual Test Script for postService
 * 
 * This script demonstrates the usage of postService functions
 * Run this in a React Native component or test environment with proper auth setup
 */

import { getPosts, createPost } from './postService';
import type { CreatePostInput } from '../types';

/**
 * Test 1: Validate empty body throws error
 */
async function testEmptyBodyValidation() {
  console.log('Test 1: Empty body validation');
  
  try {
    const input: CreatePostInput = {
      body: '   ', // Only whitespace
      sport: 'tennis',
    };
    
    await createPost(input);
    console.error('❌ FAILED: Should have thrown validation error');
  } catch (error: any) {
    if (error.code === 'VALIDATION' && error.message === 'Post body cannot be empty') {
      console.log('✅ PASSED: Correctly threw validation error for empty body');
    } else {
      console.error('❌ FAILED: Wrong error thrown:', error);
    }
  }
}

/**
 * Test 2: Validate HTML sanitization
 */
async function testHtmlSanitization() {
  console.log('\nTest 2: HTML sanitization');
  
  try {
    const input: CreatePostInput = {
      body: '<script>alert("xss")</script>Hello <b>World</b>!',
      sport: 'tennis',
    };
    
    const post = await createPost(input);
    
    // The sanitized body should not contain HTML tags
    if (post.body === 'Hello World!') {
      console.log('✅ PASSED: HTML tags stripped correctly');
      console.log('   Original:', input.body);
      console.log('   Sanitized:', post.body);
    } else {
      console.error('❌ FAILED: HTML not sanitized correctly');
      console.error('   Expected: "Hello World!"');
      console.error('   Got:', post.body);
    }
  } catch (error: any) {
    console.error('❌ FAILED: Error creating post:', error);
  }
}

/**
 * Test 3: Validate getPosts ordering (DESC by created_at)
 */
async function testGetPostsOrdering() {
  console.log('\nTest 3: getPosts ordering');
  
  try {
    // Create two posts with a small delay
    const post1 = await createPost({ body: 'First post', sport: 'tennis' });
    await new Promise(resolve => setTimeout(resolve, 100));
    const post2 = await createPost({ body: 'Second post', sport: 'tennis' });
    
    // Fetch posts
    const posts = await getPosts('tennis', 10);
    
    // The most recent post should be first
    if (posts.length >= 2 && posts[0].id === post2.id && posts[1].id === post1.id) {
      console.log('✅ PASSED: Posts ordered by created_at DESC');
    } else {
      console.error('❌ FAILED: Posts not ordered correctly');
      console.error('   Expected first:', post2.id);
      console.error('   Got first:', posts[0]?.id);
    }
  } catch (error: any) {
    console.error('❌ FAILED: Error testing ordering:', error);
  }
}

/**
 * Test 4: Validate sport filtering
 */
async function testSportFiltering() {
  console.log('\nTest 4: Sport filtering');
  
  try {
    // Create posts for different sports
    await createPost({ body: 'Tennis post', sport: 'tennis' });
    await createPost({ body: 'Skiing post', sport: 'skiing' });
    
    // Fetch only tennis posts
    const tennisPosts = await getPosts('tennis');
    
    // All posts should be tennis
    const allTennis = tennisPosts.every(post => post.sport === 'tennis');
    
    if (allTennis) {
      console.log('✅ PASSED: Sport filtering works correctly');
    } else {
      console.error('❌ FAILED: Non-tennis posts found in results');
    }
  } catch (error: any) {
    console.error('❌ FAILED: Error testing sport filtering:', error);
  }
}

/**
 * Test 5: Validate limit parameter
 */
async function testLimitParameter() {
  console.log('\nTest 5: Limit parameter');
  
  try {
    // Fetch with limit
    const posts = await getPosts('tennis', 5);
    
    if (posts.length <= 5) {
      console.log('✅ PASSED: Limit parameter respected');
      console.log('   Requested limit: 5');
      console.log('   Received:', posts.length);
    } else {
      console.error('❌ FAILED: Limit parameter not respected');
      console.error('   Expected max: 5');
      console.error('   Got:', posts.length);
    }
  } catch (error: any) {
    console.error('❌ FAILED: Error testing limit:', error);
  }
}

/**
 * Run all tests
 */
export async function runPostServiceTests() {
  console.log('=== Post Service Manual Tests ===\n');
  
  await testEmptyBodyValidation();
  await testHtmlSanitization();
  await testGetPostsOrdering();
  await testSportFiltering();
  await testLimitParameter();
  
  console.log('\n=== Tests Complete ===');
}

// Export individual tests for selective testing
export {
  testEmptyBodyValidation,
  testHtmlSanitization,
  testGetPostsOrdering,
  testSportFiltering,
  testLimitParameter,
};
