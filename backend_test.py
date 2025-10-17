#!/usr/bin/env python3
"""
Backend Test Suite for WhatsApp Sharing Integration
Tests the referral coupon system with anonymous coupon generation and WhatsApp sharing.
"""

import requests
import json
import uuid
import time
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://quickcoupon-refapp.preview.emergentagent.com/api"

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def log_pass(self, test_name):
        print(f"✅ PASS: {test_name}")
        self.passed += 1
        
    def log_fail(self, test_name, error):
        print(f"❌ FAIL: {test_name} - {error}")
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed")
        if self.errors:
            print(f"\nFAILED TESTS:")
            for error in self.errors:
                print(f"  - {error}")
        print(f"{'='*60}")
        return self.failed == 0

def test_backend_health():
    """Test if backend is running"""
    results = TestResults()
    
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=10)
        if response.status_code == 200:
            results.log_pass("Backend Health Check")
        else:
            results.log_fail("Backend Health Check", f"Status code: {response.status_code}")
    except Exception as e:
        results.log_fail("Backend Health Check", f"Connection error: {str(e)}")
    
    return results

def create_test_shopkeeper():
    """Create a test shopkeeper account and profile"""
    results = TestResults()
    
    # Generate unique test data
    test_id = uuid.uuid4().hex[:8]
    username = f"testshop_{test_id}"
    email = f"testshop_{test_id}@example.com"
    phone = f"555{test_id[:7]}"
    
    # 1. Create shopkeeper account
    signup_data = {
        "username": username,
        "email": email,
        "phone": phone,
        "role": "shopkeeper",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/signup", json=signup_data, timeout=10)
        if response.status_code == 200:
            signup_result = response.json()
            token = signup_result["access_token"]
            shopkeeper_id = signup_result["user"]["id"]
            results.log_pass("Shopkeeper Account Creation")
        else:
            results.log_fail("Shopkeeper Account Creation", f"Status: {response.status_code}, Response: {response.text}")
            return results, None, None
    except Exception as e:
        results.log_fail("Shopkeeper Account Creation", f"Error: {str(e)}")
        return results, None, None
    
    # 2. Create shopkeeper profile
    profile_data = {
        "store_name": f"Test Store {test_id}",
        "cashback_offer": "₹50 cashback",
        "store_description": "Test store for WhatsApp sharing integration"
    }
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BACKEND_URL}/shopkeeper/profile", 
                               data=profile_data, headers=headers, timeout=10)
        if response.status_code == 200:
            results.log_pass("Shopkeeper Profile Creation")
        else:
            results.log_fail("Shopkeeper Profile Creation", f"Status: {response.status_code}, Response: {response.text}")
            return results, None, None
    except Exception as e:
        results.log_fail("Shopkeeper Profile Creation", f"Error: {str(e)}")
        return results, None, None
    
    return results, shopkeeper_id, token

def test_public_coupon_generation(shopkeeper_id):
    """Test anonymous coupon generation"""
    results = TestResults()
    
    # Test data
    coupon_data = {
        "shopkeeper_id": shopkeeper_id
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/public/generate-coupon", 
                               json=coupon_data, timeout=10)
        
        if response.status_code == 200:
            coupon_result = response.json()
            
            # Verify coupon structure
            required_fields = ["id", "coupon_code", "customer_id", "shopkeeper_id", "click_count", "is_redeemed"]
            for field in required_fields:
                if field not in coupon_result:
                    results.log_fail("Public Coupon Generation - Field Check", f"Missing field: {field}")
                    return results, None
            
            # Verify anonymous customer_id
            if not coupon_result["customer_id"].startswith("anonymous_"):
                results.log_fail("Public Coupon Generation - Anonymous ID", 
                               f"Customer ID should start with 'anonymous_', got: {coupon_result['customer_id']}")
                return results, None
            
            # Verify default values
            if coupon_result["click_count"] != 0:
                results.log_fail("Public Coupon Generation - Default Click Count", 
                               f"Expected click_count=0, got: {coupon_result['click_count']}")
                return results, None
                
            if coupon_result["is_redeemed"] != False:
                results.log_fail("Public Coupon Generation - Default Redeemed Status", 
                               f"Expected is_redeemed=False, got: {coupon_result['is_redeemed']}")
                return results, None
            
            # Verify shopkeeper_id matches
            if coupon_result["shopkeeper_id"] != shopkeeper_id:
                results.log_fail("Public Coupon Generation - Shopkeeper ID", 
                               f"Expected shopkeeper_id={shopkeeper_id}, got: {coupon_result['shopkeeper_id']}")
                return results, None
            
            # Verify unique coupon_code is generated
            if not coupon_result["coupon_code"] or len(coupon_result["coupon_code"]) < 4:
                results.log_fail("Public Coupon Generation - Coupon Code", 
                               f"Invalid coupon_code: {coupon_result['coupon_code']}")
                return results, None
            
            results.log_pass("Public Coupon Generation - All Validations")
            return results, coupon_result["coupon_code"]
            
        else:
            results.log_fail("Public Coupon Generation", f"Status: {response.status_code}, Response: {response.text}")
            return results, None
            
    except Exception as e:
        results.log_fail("Public Coupon Generation", f"Error: {str(e)}")
        return results, None

def test_whatsapp_share_tracking(coupon_code):
    """Test WhatsApp share tracking"""
    results = TestResults()
    
    # Test data
    share_data = {
        "coupon_code": coupon_code
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/public/track-share", 
                               json=share_data, timeout=10)
        
        if response.status_code == 200:
            share_result = response.json()
            
            # Verify response structure
            expected_fields = ["message", "share_clicked", "can_redeem", "is_redeemed"]
            for field in expected_fields:
                if field not in share_result:
                    results.log_fail("WhatsApp Share Tracking - Field Check", f"Missing field: {field}")
                    return results, False
            
            # Verify share_clicked is set to true
            if share_result["share_clicked"] != True:
                results.log_fail("WhatsApp Share Tracking - Share Clicked Status", 
                               f"Expected share_clicked=True, got: {share_result['share_clicked']}")
                return results, False
            
            # Verify can_redeem is true after sharing
            if share_result["can_redeem"] != True:
                results.log_fail("WhatsApp Share Tracking - Can Redeem Status", 
                               f"Expected can_redeem=True, got: {share_result['can_redeem']}")
                return results, False
            
            # Verify is_redeemed is still false
            if share_result["is_redeemed"] != False:
                results.log_fail("WhatsApp Share Tracking - Redeemed Status", 
                               f"Expected is_redeemed=False, got: {share_result['is_redeemed']}")
                return results, False
            
            results.log_pass("WhatsApp Share Tracking - All Validations")
            return results, True
            
        else:
            results.log_fail("WhatsApp Share Tracking", f"Status: {response.status_code}, Response: {response.text}")
            return results, False
            
    except Exception as e:
        results.log_fail("WhatsApp Share Tracking", f"Error: {str(e)}")
        return results, False

def test_coupon_redemption_without_share(coupon_code):
    """Test that redemption fails if share_clicked is false"""
    results = TestResults()
    
    # Create a new coupon that hasn't been shared
    try:
        # First create another coupon for this test
        response = requests.post(f"{BACKEND_URL}/public/generate-coupon", 
                               json={"shopkeeper_id": "test"}, timeout=10)
        if response.status_code != 200:
            results.log_fail("Coupon Redemption Without Share - Setup", "Could not create test coupon")
            return results
        
        new_coupon_code = response.json()["coupon_code"]
        
        # Try to redeem without sharing
        redeem_data = {"coupon_code": new_coupon_code}
        response = requests.post(f"{BACKEND_URL}/public/redeem-coupon", 
                               json=redeem_data, timeout=10)
        
        # Should fail with 400 status
        if response.status_code == 400:
            error_msg = response.json().get("detail", "")
            if "share via WhatsApp" in error_msg:
                results.log_pass("Coupon Redemption Without Share - Validation")
            else:
                results.log_fail("Coupon Redemption Without Share - Error Message", 
                               f"Expected WhatsApp share error, got: {error_msg}")
        else:
            results.log_fail("Coupon Redemption Without Share", 
                           f"Expected 400 status, got: {response.status_code}")
            
    except Exception as e:
        results.log_fail("Coupon Redemption Without Share", f"Error: {str(e)}")
    
    return results

def test_coupon_redemption_with_share(coupon_code, shopkeeper_token):
    """Test successful coupon redemption after sharing"""
    results = TestResults()
    
    # Test data
    redeem_data = {
        "coupon_code": coupon_code
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/public/redeem-coupon", 
                               json=redeem_data, timeout=10)
        
        if response.status_code == 200:
            redeem_result = response.json()
            
            # Verify response structure
            expected_fields = ["message", "is_redeemed", "cashback_earned"]
            for field in expected_fields:
                if field not in redeem_result:
                    results.log_fail("Coupon Redemption - Field Check", f"Missing field: {field}")
                    return results
            
            # Verify is_redeemed is true
            if redeem_result["is_redeemed"] != True:
                results.log_fail("Coupon Redemption - Redeemed Status", 
                               f"Expected is_redeemed=True, got: {redeem_result['is_redeemed']}")
                return results
            
            # Verify cashback_earned is populated
            if not redeem_result["cashback_earned"]:
                results.log_fail("Coupon Redemption - Cashback Earned", 
                               "cashback_earned should be populated from shopkeeper profile")
                return results
            
            # Verify cashback matches shopkeeper profile
            expected_cashback = "₹50 cashback"  # From our test profile
            if redeem_result["cashback_earned"] != expected_cashback:
                results.log_fail("Coupon Redemption - Cashback Amount", 
                               f"Expected '{expected_cashback}', got: '{redeem_result['cashback_earned']}'")
                return results
            
            results.log_pass("Coupon Redemption - All Validations")
            
        else:
            results.log_fail("Coupon Redemption", f"Status: {response.status_code}, Response: {response.text}")
            
    except Exception as e:
        results.log_fail("Coupon Redemption", f"Error: {str(e)}")
    
    return results

def test_double_redemption(coupon_code):
    """Test that double redemption is prevented"""
    results = TestResults()
    
    redeem_data = {"coupon_code": coupon_code}
    
    try:
        response = requests.post(f"{BACKEND_URL}/public/redeem-coupon", 
                               json=redeem_data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("already_redeemed") == True:
                results.log_pass("Double Redemption Prevention")
            else:
                results.log_fail("Double Redemption Prevention", 
                               "Should return already_redeemed=True for double redemption")
        else:
            results.log_fail("Double Redemption Prevention", 
                           f"Unexpected status: {response.status_code}")
            
    except Exception as e:
        results.log_fail("Double Redemption Prevention", f"Error: {str(e)}")
    
    return results

def main():
    """Run all WhatsApp sharing integration tests"""
    print("🚀 Starting WhatsApp Sharing Integration Tests")
    print(f"Backend URL: {BACKEND_URL}")
    print("="*60)
    
    all_results = TestResults()
    
    # 1. Test backend health
    print("\n1. Testing Backend Health...")
    health_results = test_backend_health()
    all_results.passed += health_results.passed
    all_results.failed += health_results.failed
    all_results.errors.extend(health_results.errors)
    
    if health_results.failed > 0:
        print("❌ Backend is not accessible. Stopping tests.")
        all_results.summary()
        return False
    
    # 2. Create test shopkeeper
    print("\n2. Creating Test Shopkeeper...")
    shopkeeper_results, shopkeeper_id, shopkeeper_token = create_test_shopkeeper()
    all_results.passed += shopkeeper_results.passed
    all_results.failed += shopkeeper_results.failed
    all_results.errors.extend(shopkeeper_results.errors)
    
    if not shopkeeper_id:
        print("❌ Could not create test shopkeeper. Stopping tests.")
        all_results.summary()
        return False
    
    print(f"✅ Test shopkeeper created with ID: {shopkeeper_id}")
    
    # 3. Test public coupon generation
    print("\n3. Testing Public Coupon Generation...")
    coupon_results, coupon_code = test_public_coupon_generation(shopkeeper_id)
    all_results.passed += coupon_results.passed
    all_results.failed += coupon_results.failed
    all_results.errors.extend(coupon_results.errors)
    
    if not coupon_code:
        print("❌ Could not generate coupon. Stopping tests.")
        all_results.summary()
        return False
    
    print(f"✅ Coupon generated with code: {coupon_code}")
    
    # 4. Test redemption without share (should fail)
    print("\n4. Testing Redemption Without Share...")
    no_share_results = test_coupon_redemption_without_share(coupon_code)
    all_results.passed += no_share_results.passed
    all_results.failed += no_share_results.failed
    all_results.errors.extend(no_share_results.errors)
    
    # 5. Test WhatsApp share tracking
    print("\n5. Testing WhatsApp Share Tracking...")
    share_results, share_success = test_whatsapp_share_tracking(coupon_code)
    all_results.passed += share_results.passed
    all_results.failed += share_results.failed
    all_results.errors.extend(share_results.errors)
    
    if not share_success:
        print("❌ WhatsApp share tracking failed. Stopping tests.")
        all_results.summary()
        return False
    
    # 6. Test coupon redemption after sharing
    print("\n6. Testing Coupon Redemption After Sharing...")
    redemption_results = test_coupon_redemption_with_share(coupon_code, shopkeeper_token)
    all_results.passed += redemption_results.passed
    all_results.failed += redemption_results.failed
    all_results.errors.extend(redemption_results.errors)
    
    # 7. Test double redemption prevention
    print("\n7. Testing Double Redemption Prevention...")
    double_redeem_results = test_double_redemption(coupon_code)
    all_results.passed += double_redeem_results.passed
    all_results.failed += double_redeem_results.failed
    all_results.errors.extend(double_redeem_results.errors)
    
    # Final summary
    success = all_results.summary()
    
    if success:
        print("\n🎉 All WhatsApp sharing integration tests passed!")
    else:
        print("\n💥 Some tests failed. Check the errors above.")
    
    return success

if __name__ == "__main__":
    main()