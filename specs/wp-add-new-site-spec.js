import test from 'selenium-webdriver/testing';
import config from 'config';
import assert from 'assert';

import * as driverManager from '../lib/driver-manager';
import * as dataHelper from '../lib/data-helper';

import LoginFlow from '../lib/flows/login-flow';

import WPHomePage from '../lib/pages/wp-home-page.js';
import ChooseAThemePage from '../lib/pages/signup/choose-a-theme-page.js';
import StartPage from '../lib/pages/signup/start-page.js';
import SurveyPage from '../lib/pages/signup/survey-page.js';
import DesignTypeChoicePage from '../lib/pages/signup/design-type-choice-page.js';
import PickAPlanPage from '../lib/pages/signup/pick-a-plan-page.js';
import SignupProcessingPage from '../lib/pages/signup/signup-processing-page.js';
import CheckOutThankyouPage from '../lib/pages/signup/checkout-thankyou-page.js';

import FindADomainComponent from '../lib/components/find-a-domain-component.js';
import SecurePaymentComponent from '../lib/components/secure-payment-component.js';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();

let driver;

test.before( 'Start Browser', function() {
	this.timeout( startBrowserTimeoutMS );
	driver = driverManager.startBrowser();
} );

test.describe( 'Add new site to existing account (' + screenSize + ')', function() {
	this.timeout( mochaTimeOut );

	test.describe( 'Add a new site on a business paid plan with currency in EUR', function() {
		this.bailSuite( true );

		const blogName = 'e2e' + new Date().getTime().toString();
		const expectedBlogAddresses = dataHelper.getExpectedFreeAddresses( blogName );
		const sandboxCookieValue = config.get( 'storeSandboxCookieValue' );
		const testCardHolder = 'End To End Testing';
		const testVisaNumber = '4483910254901646';
		const testVisaExpiry = '02/19';
		const testCVV = '300';
		const testCardCountryCode = 'AU';
		const testCardPostCode = '4000';

		test.it( 'Ensure we are not logged in as anyone', function() {
			return driverManager.ensureNotLoggedIn( driver );
		} );

		test.it( 'We can set the sandbox cookie for payments', function() {
			this.WPHomePage = new WPHomePage( driver, { visit: true } );
			this.WPHomePage.setSandboxModeForPayments( sandboxCookieValue );
		} );

		test.it( 'Sign in as user with currency set to EUR', function() {
			this.loginFlow = new LoginFlow( driver, 'eurAccountUser' );
			return this.loginFlow.login();
		} );

		test.describe( 'Step One: Survey', function() {
			test.it( 'When we visit the start URL we see the survey page', function() {
				this.startPage = new StartPage( driver, { visit: true } );
				this.surveyPage = new SurveyPage( driver );
				return this.surveyPage.displayed().then( ( displayed ) => {
					return assert.equal( displayed, true, 'The survey starting page is not displayed' );
				} );
			} );

			test.it( 'Can select the first survey option', function() {
				this.surveyPage.selectFirstSurveyOptions();
			} );

			test.describe( 'Step Two: Design Type Choice', function() {
				test.it( 'Can see the design type choice page', function() {
					this.designTypeChoicePage = new DesignTypeChoicePage( driver );
					return this.designTypeChoicePage.displayed().then( ( displayed ) => {
						return assert.equal( displayed, true, 'The design type choice page is not displayed' );
					} );
				} );

				test.it( 'Can select the first design type', function() {
					this.designTypeChoicePage.selectFirstDesignType();
				} );

				test.describe( 'Step Three: Themes', function() {
					test.it( 'Can see the choose a theme page as the starting page', function() {
						this.chooseAThemePage = new ChooseAThemePage( driver );
						return this.chooseAThemePage.displayed().then( ( displayed ) => {
							return assert.equal( displayed, true, 'The choose a theme start page is not displayed' );
						} );
					} );

					test.it( 'Can select the first theme', function() {
						return this.chooseAThemePage.selectFirstTheme();
					} );

					test.describe( 'Step Four: Domains', function() {
						test.it( 'Can then see the domains page ', function() {
							this.findADomainComponent = new FindADomainComponent( driver );
							return this.findADomainComponent.displayed().then( ( displayed ) => {
								return assert.equal( displayed, true, 'The choose a domain page is not displayed' );
							} );
						} );

						test.it( 'Can search for a blog name, can see and select a free WordPress.com blog address in results', function() {
							this.findADomainComponent.searchForBlogNameAndWaitForResults( blogName );
							this.findADomainComponent.checkAndRetryForFreeBlogAddresses( expectedBlogAddresses, blogName );
							this.findADomainComponent.freeBlogAddress().then( ( actualAddress ) => {
								assert( expectedBlogAddresses.indexOf( actualAddress ) > -1, `The displayed free blog address: '${actualAddress}' was not the expected addresses: '${expectedBlogAddresses}'` );
							} );
							return this.findADomainComponent.selectFreeAddress();
						} );

						test.describe( 'Step Five: Plans', function() {
							test.it( 'Can then see the plans page', function() {
								this.pickAPlanPage = new PickAPlanPage( driver );
								return this.pickAPlanPage.displayed().then( ( displayed ) => {
									return assert.equal( displayed, true, 'The pick a plan page is not displayed' );
								} );
							} );

							test.it( 'Can see prices in EUR', function() {
								const eurSymbol = '€';
								this.pickAPlanPage.premiumPlanPrice().then( ( price ) => {
									assert( price.indexOf( eurSymbol ) === 0, `The premium price '${price} does not start with '${eurSymbol}'` );
								} );
								this.pickAPlanPage.businessPlanPrice().then( ( price ) => {
									assert( price.indexOf( eurSymbol ) === 0, `The business price '${price} does not start with '${eurSymbol}'` );
								} );
							} );

							test.it( 'Can select the business plan', function() {
								return this.pickAPlanPage.selectBusinessPlan();
							} );

							test.describe( 'Step Six: Processing', function() {
								test.it( 'Can then see the sign up processing page', function() {
									this.signupProcessingPage = new SignupProcessingPage( driver );
									return this.signupProcessingPage.displayed().then( ( displayed ) => {
										return assert.equal( displayed, true, 'The sign up processing page is not displayed' );
									} );
								} );

								test.it( 'The sign up processing page will finish and show a \'Continue\' button', function() {
									this.signupProcessingPage.waitForContinueButtonToBeEnabled();
								} );

								test.it( 'Clicking the \'Continue\' button continues the process', function() {
									this.signupProcessingPage.continueAlong();
								} );

								test.describe( 'Step Seven: Secure Payment Page', function() {
									test.it( 'Can then see the secure payment page', function() {
										this.securePaymentComponent = new SecurePaymentComponent( driver );
										return this.securePaymentComponent.displayed().then( ( displayed ) => {
											return assert.equal( displayed, true, 'The secure payment page is not displayed' );
										} );
									} );

									test.it( 'Can see payment total in EUR', function() {
										this.securePaymentComponent.payTotalButton().then( ( total ) => {
											const eurSymbol = '€';
											assert( total.indexOf( eurSymbol ) !== -1, `The payment total '${total} does not contain '${eurSymbol}'` );
										} );
									} );

									test.it( 'Can enter and submit test payment details', function() {
										this.securePaymentComponent.enterTestCreditCardDetails( testCardHolder, testVisaNumber, testVisaExpiry, testCVV, testCardCountryCode, testCardPostCode );
										this.securePaymentComponent.submitPaymentDetails();
										return this.securePaymentComponent.waitForPageToDisappear();
									} );

									test.describe( 'Step Eight: Checkout Thank You Page', function() {
										test.it( 'Can see the secure check out thank you page', function() {
											this.CheckOutThankyouPage = new CheckOutThankyouPage( driver );
											return this.CheckOutThankyouPage.displayed().then( ( displayed ) => {
												return assert.equal( displayed, true, 'The checkout thank you page is not displayed' );
											} );
										} );
									} );
								} );
							} );
						} );
					} );
				} );
			} );
		} );
	} );

	test.describe( 'Add a new site on a premium paid plan with currency in AUD', function() {
		this.bailSuite( true );

		const blogName = 'e2e' + new Date().getTime().toString();
		const expectedBlogAddresses = dataHelper.getExpectedFreeAddresses( blogName );
		const sandboxCookieValue = config.get( 'storeSandboxCookieValue' );
		const testCardHolder = 'End To End Testing';
		const testVisaNumber = '4483910254901646';
		const testVisaExpiry = '02/19';
		const testCVV = '300';
		const testCardCountryCode = 'AU';
		const testCardPostCode = '4000';

		test.it( 'Ensure we are not logged in as anyone', function() {
			return driverManager.ensureNotLoggedIn( driver );
		} );

		test.it( 'We can set the sandbox cookie for payments', function() {
			this.WPHomePage = new WPHomePage( driver, { visit: true } );
			this.WPHomePage.setSandboxModeForPayments( sandboxCookieValue );
		} );

		test.it( 'Sign in as user with currency set to AUD', function() {
			this.loginFlow = new LoginFlow( driver, 'audAccountUser' );
			return this.loginFlow.login();
		} );

		test.describe( 'Step One: Survey', function() {
			test.it( 'When we visit the start URL we see the survey page', function() {
				this.startPage = new StartPage( driver, { visit: true } );
				this.surveyPage = new SurveyPage( driver );
				return this.surveyPage.displayed().then( ( displayed ) => {
					return assert.equal( displayed, true, 'The survey starting page is not displayed' );
				} );
			} );

			test.it( 'Can select the first survey option', function() {
				this.surveyPage.selectFirstSurveyOptions();
			} );

			test.describe( 'Step Two: Design Type Choice', function() {
				test.it( 'Can see the design type choice page', function() {
					this.designTypeChoicePage = new DesignTypeChoicePage( driver );
					return this.designTypeChoicePage.displayed().then( ( displayed ) => {
						return assert.equal( displayed, true, 'The design type choice page is not displayed' );
					} );
				} );

				test.it( 'Can select the first design type', function() {
					this.designTypeChoicePage.selectFirstDesignType();
				} );

				test.describe( 'Step Three: Themes', function() {
					test.it( 'Can see the choose a theme page as the starting page', function() {
						this.chooseAThemePage = new ChooseAThemePage( driver );
						return this.chooseAThemePage.displayed().then( ( displayed ) => {
							return assert.equal( displayed, true, 'The choose a theme start page is not displayed' );
						} );
					} );

					test.it( 'Can select the first theme', function() {
						return this.chooseAThemePage.selectFirstTheme();
					} );

					test.describe( 'Step Four: Domains', function() {
						test.it( 'Can then see the domains page ', function() {
							this.findADomainComponent = new FindADomainComponent( driver );
							return this.findADomainComponent.displayed().then( ( displayed ) => {
								return assert.equal( displayed, true, 'The choose a domain page is not displayed' );
							} );
						} );

						test.it( 'Can search for a blog name, can see and select a free WordPress.com blog address in results', function() {
							this.findADomainComponent.searchForBlogNameAndWaitForResults( blogName );
							this.findADomainComponent.checkAndRetryForFreeBlogAddresses( expectedBlogAddresses, blogName );
							this.findADomainComponent.freeBlogAddress().then( ( actualAddress ) => {
								assert( expectedBlogAddresses.indexOf( actualAddress ) > -1, `The displayed free blog address: '${actualAddress}' was not the expected addresses: '${expectedBlogAddresses}'` );
							} );
							return this.findADomainComponent.selectFreeAddress();
						} );

						test.describe( 'Step Five: Plans', function() {
							test.it( 'Can then see the plans page', function() {
								this.pickAPlanPage = new PickAPlanPage( driver );
								return this.pickAPlanPage.displayed().then( ( displayed ) => {
									return assert.equal( displayed, true, 'The pick a plan page is not displayed' );
								} );
							} );

							test.it( 'Can see prices in AUD', function() {
								const audSymbol = 'A$';
								this.pickAPlanPage.premiumPlanPrice().then( ( price ) => {
									assert( price.indexOf( audSymbol ) === 0, `The premium price '${price} does not start with '${audSymbol}'` );
								} );
								this.pickAPlanPage.businessPlanPrice().then( ( price ) => {
									assert( price.indexOf( audSymbol ) === 0, `The business price '${price} does not start with '${audSymbol}'` );
								} );
							} );

							test.it( 'Can select the premium plan', function() {
								return this.pickAPlanPage.selectPremiumPlan();
							} );

							test.describe( 'Step Six: Processing', function() {
								test.it( 'Can then see the sign up processing page', function() {
									this.signupProcessingPage = new SignupProcessingPage( driver );
									return this.signupProcessingPage.displayed().then( ( displayed ) => {
										return assert.equal( displayed, true, 'The sign up processing page is not displayed' );
									} );
								} );

								test.it( 'The sign up processing page will finish and show a \'Continue\' button', function() {
									this.signupProcessingPage.waitForContinueButtonToBeEnabled();
								} );

								test.it( 'Clicking the \'Continue\' button continues the process', function() {
									this.signupProcessingPage.continueAlong();
								} );

								test.describe( 'Step Seven: Secure Payment Page', function() {
									test.it( 'Can then see the secure payment page', function() {
										this.securePaymentComponent = new SecurePaymentComponent( driver );
										return this.securePaymentComponent.displayed().then( ( displayed ) => {
											return assert.equal( displayed, true, 'The secure payment page is not displayed' );
										} );
									} );

									test.it( 'Can see payment total in AUD', function() {
										this.securePaymentComponent.payTotalButton().then( ( total ) => {
											const audSymbol = 'A$';
											assert( total.indexOf( audSymbol ) !== -1, `The payment total '${total} does not contain '${audSymbol}'` );
										} );
									} );

									test.it( 'Can enter and submit test payment details', function() {
										this.securePaymentComponent.enterTestCreditCardDetails( testCardHolder, testVisaNumber, testVisaExpiry, testCVV, testCardCountryCode, testCardPostCode );
										this.securePaymentComponent.submitPaymentDetails();
										return this.securePaymentComponent.waitForPageToDisappear();
									} );

									test.describe( 'Step Eight: Checkout Thank You Page', function() {
										test.it( 'Can see the secure check out thank you page', function() {
											this.CheckOutThankyouPage = new CheckOutThankyouPage( driver );
											return this.CheckOutThankyouPage.displayed().then( ( displayed ) => {
												return assert.equal( displayed, true, 'The checkout thank you page is not displayed' );
											} );
										} );
									} );
								} );
							} );
						} );
					} );
				} );
			} );
		} );
	} );

	test.describe( 'Add a new site on a business paid plan with currency in CAD', function() {
		this.bailSuite( true );

		const blogName = 'e2e' + new Date().getTime().toString();
		const expectedBlogAddresses = dataHelper.getExpectedFreeAddresses( blogName );
		const sandboxCookieValue = config.get( 'storeSandboxCookieValue' );
		const testCardHolder = 'End To End Testing';
		const testVisaNumber = '4483910254901646';
		const testVisaExpiry = '02/19';
		const testCVV = '300';
		const testCardCountryCode = 'AU';
		const testCardPostCode = '4000';

		test.it( 'Ensure we are not logged in as anyone', function() {
			return driverManager.ensureNotLoggedIn( driver );
		} );

		test.it( 'We can set the sandbox cookie for payments', function() {
			this.WPHomePage = new WPHomePage( driver, { visit: true } );
			this.WPHomePage.setSandboxModeForPayments( sandboxCookieValue );
		} );

		test.it( 'Sign in as user with currency set to CAD', function() {
			this.loginFlow = new LoginFlow( driver, 'cadAccountUser' );
			return this.loginFlow.login();
		} );

		test.describe( 'Step One: Survey', function() {
			test.it( 'When we visit the start URL we see the survey page', function() {
				this.startPage = new StartPage( driver, { visit: true } );
				this.surveyPage = new SurveyPage( driver );
				return this.surveyPage.displayed().then( ( displayed ) => {
					return assert.equal( displayed, true, 'The survey starting page is not displayed' );
				} );
			} );

			test.it( 'Can select the first survey option', function() {
				this.surveyPage.selectFirstSurveyOptions();
			} );

			test.describe( 'Step Two: Design Type Choice', function() {
				test.it( 'Can see the design type choice page', function() {
					this.designTypeChoicePage = new DesignTypeChoicePage( driver );
					return this.designTypeChoicePage.displayed().then( ( displayed ) => {
						return assert.equal( displayed, true, 'The design type choice page is not displayed' );
					} );
				} );

				test.it( 'Can select the first design type', function() {
					this.designTypeChoicePage.selectFirstDesignType();
				} );

				test.describe( 'Step Three: Themes', function() {
					test.it( 'Can see the choose a theme page as the starting page', function() {
						this.chooseAThemePage = new ChooseAThemePage( driver );
						return this.chooseAThemePage.displayed().then( ( displayed ) => {
							return assert.equal( displayed, true, 'The choose a theme start page is not displayed' );
						} );
					} );

					test.it( 'Can select the first theme', function() {
						return this.chooseAThemePage.selectFirstTheme();
					} );

					test.describe( 'Step Four: Domains', function() {
						test.it( 'Can then see the domains page ', function() {
							this.findADomainComponent = new FindADomainComponent( driver );
							return this.findADomainComponent.displayed().then( ( displayed ) => {
								return assert.equal( displayed, true, 'The choose a domain page is not displayed' );
							} );
						} );

						test.it( 'Can search for a blog name, can see and select a free WordPress.com blog address in results', function() {
							this.findADomainComponent.searchForBlogNameAndWaitForResults( blogName );
							this.findADomainComponent.checkAndRetryForFreeBlogAddresses( expectedBlogAddresses, blogName );
							this.findADomainComponent.freeBlogAddress().then( ( actualAddress ) => {
								assert( expectedBlogAddresses.indexOf( actualAddress ) > -1, `The displayed free blog address: '${actualAddress}' was not the expected addresses: '${expectedBlogAddresses}'` );
							} );
							return this.findADomainComponent.selectFreeAddress();
						} );

						test.describe( 'Step Five: Plans', function() {
							test.it( 'Can then see the plans page', function() {
								this.pickAPlanPage = new PickAPlanPage( driver );
								return this.pickAPlanPage.displayed().then( ( displayed ) => {
									return assert.equal( displayed, true, 'The pick a plan page is not displayed' );
								} );
							} );

							test.it( 'Can see prices in CAD', function() {
								const cadSymbol = 'C$';
								this.pickAPlanPage.premiumPlanPrice().then( ( price ) => {
									assert( price.indexOf( cadSymbol ) === 0, `The premium plan price '${price} does not start with '${cadSymbol}'` );
								} );
								this.pickAPlanPage.businessPlanPrice().then( ( price ) => {
									assert( price.indexOf( cadSymbol ) === 0, `The business plan price '${price} does not start with '${cadSymbol}'` );
								} );
							} );

							test.it( 'Can select the business plan', function() {
								return this.pickAPlanPage.selectBusinessPlan();
							} );

							test.describe( 'Step Six: Processing', function() {
								test.it( 'Can then see the sign up processing page', function() {
									this.signupProcessingPage = new SignupProcessingPage( driver );
									return this.signupProcessingPage.displayed().then( ( displayed ) => {
										return assert.equal( displayed, true, 'The sign up processing page is not displayed' );
									} );
								} );

								test.it( 'The sign up processing page will finish and show a \'Continue\' button', function() {
									this.signupProcessingPage.waitForContinueButtonToBeEnabled();
								} );

								test.it( 'Clicking the \'Continue\' button continues the process', function() {
									this.signupProcessingPage.continueAlong();
								} );

								test.describe( 'Step Seven: Secure Payment Page', function() {
									test.it( 'Can then see the secure payment page', function() {
										this.securePaymentComponent = new SecurePaymentComponent( driver );
										return this.securePaymentComponent.displayed().then( ( displayed ) => {
											return assert.equal( displayed, true, 'The secure payment page is not displayed' );
										} );
									} );

									test.it( 'Can see payment total in CAD', function() {
										this.securePaymentComponent.payTotalButton().then( ( total ) => {
											const cadSymbol = 'C$';
											assert( total.indexOf( cadSymbol ) !== -1, `The payment total '${total} does not contain '${cadSymbol}'` );
										} );
									} );

									test.it( 'Can enter and submit test payment details', function() {
										this.securePaymentComponent.enterTestCreditCardDetails( testCardHolder, testVisaNumber, testVisaExpiry, testCVV, testCardCountryCode, testCardPostCode );
										this.securePaymentComponent.submitPaymentDetails();
										return this.securePaymentComponent.waitForPageToDisappear();
									} );

									test.describe( 'Step Eight: Checkout Thank You Page', function() {
										test.it( 'Can see the secure check out thank you page', function() {
											this.CheckOutThankyouPage = new CheckOutThankyouPage( driver );
											return this.CheckOutThankyouPage.displayed().then( ( displayed ) => {
												return assert.equal( displayed, true, 'The checkout thank you page is not displayed' );
											} );
										} );
									} );
								} );
							} );
						} );
					} );
				} );
			} );
		} );
	} );

	test.describe( 'Add a new site on a business paid plan with currency in GBP', function() {
		this.bailSuite( true );

		const blogName = 'e2e' + new Date().getTime().toString();
		const expectedBlogAddresses = dataHelper.getExpectedFreeAddresses( blogName );
		const sandboxCookieValue = config.get( 'storeSandboxCookieValue' );
		const testCardHolder = 'End To End Testing';
		const testVisaNumber = '4483910254901646';
		const testVisaExpiry = '02/19';
		const testCVV = '300';
		const testCardCountryCode = 'AU';
		const testCardPostCode = '4000';

		test.it( 'Ensure we are not logged in as anyone', function() {
			return driverManager.ensureNotLoggedIn( driver );
		} );

		test.it( 'We can set the sandbox cookie for payments', function() {
			this.WPHomePage = new WPHomePage( driver, { visit: true } );
			this.WPHomePage.setSandboxModeForPayments( sandboxCookieValue );
		} );

		test.it( 'Sign in as user with currency set to GBP', function() {
			this.loginFlow = new LoginFlow( driver, 'gbpAccountUser' );
			return this.loginFlow.login();
		} );

		test.describe( 'Step One: Survey', function() {
			test.it( 'When we visit the start URL we see the survey page', function() {
				this.startPage = new StartPage( driver, { visit: true } );
				this.surveyPage = new SurveyPage( driver );
				return this.surveyPage.displayed().then( ( displayed ) => {
					return assert.equal( displayed, true, 'The survey starting page is not displayed' );
				} );
			} );

			test.it( 'Can select the first survey option', function() {
				this.surveyPage.selectFirstSurveyOptions();
			} );

			test.describe( 'Step Two: Design Type Choice', function() {
				test.it( 'Can see the design type choice page', function() {
					this.designTypeChoicePage = new DesignTypeChoicePage( driver );
					return this.designTypeChoicePage.displayed().then( ( displayed ) => {
						return assert.equal( displayed, true, 'The design type choice page is not displayed' );
					} );
				} );

				test.it( 'Can select the first design type', function() {
					this.designTypeChoicePage.selectFirstDesignType();
				} );

				test.describe( 'Step Three: Themes', function() {
					test.it( 'Can see the choose a theme page as the starting page', function() {
						this.chooseAThemePage = new ChooseAThemePage( driver );
						return this.chooseAThemePage.displayed().then( ( displayed ) => {
							return assert.equal( displayed, true, 'The choose a theme start page is not displayed' );
						} );
					} );

					test.it( 'Can select the first theme', function() {
						return this.chooseAThemePage.selectFirstTheme();
					} );

					test.describe( 'Step Four: Domains', function() {
						test.it( 'Can then see the domains page ', function() {
							this.findADomainComponent = new FindADomainComponent( driver );
							return this.findADomainComponent.displayed().then( ( displayed ) => {
								return assert.equal( displayed, true, 'The choose a domain page is not displayed' );
							} );
						} );

						test.it( 'Can search for a blog name, can see and select a free WordPress.com blog address in results', function() {
							this.findADomainComponent.searchForBlogNameAndWaitForResults( blogName );
							this.findADomainComponent.checkAndRetryForFreeBlogAddresses( expectedBlogAddresses, blogName );
							this.findADomainComponent.freeBlogAddress().then( ( actualAddress ) => {
								assert( expectedBlogAddresses.indexOf( actualAddress ) > -1, `The displayed free blog address: '${actualAddress}' was not the expected addresses: '${expectedBlogAddresses}'` );
							} );
							return this.findADomainComponent.selectFreeAddress();
						} );

						test.describe( 'Step Five: Plans', function() {
							test.it( 'Can then see the plans page', function() {
								this.pickAPlanPage = new PickAPlanPage( driver );
								return this.pickAPlanPage.displayed().then( ( displayed ) => {
									return assert.equal( displayed, true, 'The pick a plan page is not displayed' );
								} );
							} );

							test.it( 'Can see prices in GBP', function() {
								const gbpSymbol = '£';
								this.pickAPlanPage.premiumPlanPrice().then( ( price ) => {
									assert( price.indexOf( gbpSymbol ) === 0, `The premium price '${price} does not start with '${gbpSymbol}'` );
								} );
								this.pickAPlanPage.businessPlanPrice().then( ( price ) => {
									assert( price.indexOf( gbpSymbol ) === 0, `The business price '${price} does not start with '${gbpSymbol}'` );
								} );
							} );

							test.it( 'Can select the business plan', function() {
								return this.pickAPlanPage.selectBusinessPlan();
							} );

							test.describe( 'Step Six: Processing', function() {
								test.it( 'Can then see the sign up processing page', function() {
									this.signupProcessingPage = new SignupProcessingPage( driver );
									return this.signupProcessingPage.displayed().then( ( displayed ) => {
										return assert.equal( displayed, true, 'The sign up processing page is not displayed' );
									} );
								} );

								test.it( 'The sign up processing page will finish and show a \'Continue\' button', function() {
									this.signupProcessingPage.waitForContinueButtonToBeEnabled();
								} );

								test.it( 'Clicking the \'Continue\' button continues the process', function() {
									this.signupProcessingPage.continueAlong();
								} );

								test.describe( 'Step Seven: Secure Payment Page', function() {
									test.it( 'Can then see the secure payment page', function() {
										this.securePaymentComponent = new SecurePaymentComponent( driver );
										return this.securePaymentComponent.displayed().then( ( displayed ) => {
											return assert.equal( displayed, true, 'The secure payment page is not displayed' );
										} );
									} );

									test.it( 'Can see payment total in GBP', function() {
										this.securePaymentComponent.payTotalButton().then( ( total ) => {
											const gbpSymbol = '£';
											assert( total.indexOf( gbpSymbol ) !== -1, `The payment total '${total} does not contain '${gbpSymbol}'` );
										} );
									} );

									test.it( 'Can enter and submit test payment details', function() {
										this.securePaymentComponent.enterTestCreditCardDetails( testCardHolder, testVisaNumber, testVisaExpiry, testCVV, testCardCountryCode, testCardPostCode );
										this.securePaymentComponent.submitPaymentDetails();
										return this.securePaymentComponent.waitForPageToDisappear();
									} );

									test.describe( 'Step Eight: Checkout Thank You Page', function() {
										test.it( 'Can see the secure check out thank you page', function() {
											this.CheckOutThankyouPage = new CheckOutThankyouPage( driver );
											return this.CheckOutThankyouPage.displayed().then( ( displayed ) => {
												return assert.equal( displayed, true, 'The checkout thank you page is not displayed' );
											} );
										} );
									} );
								} );
							} );
						} );
					} );
				} );
			} );
		} );
	} );

	test.describe( 'Add a new site on a premium paid plan with currency in JPY', function() {
		this.bailSuite( true );

		const blogName = 'e2e' + new Date().getTime().toString();
		const expectedBlogAddresses = dataHelper.getExpectedFreeAddresses( blogName );
		const sandboxCookieValue = config.get( 'storeSandboxCookieValue' );
		const testCardHolder = 'End To End Testing';
		const testVisaNumber = '4483910254901646';
		const testVisaExpiry = '02/19';
		const testCVV = '300';
		const testCardCountryCode = 'AU';
		const testCardPostCode = '4000';

		test.it( 'Ensure we are not logged in as anyone', function() {
			return driverManager.ensureNotLoggedIn( driver );
		} );

		test.it( 'We can set the sandbox cookie for payments', function() {
			this.WPHomePage = new WPHomePage( driver, { visit: true } );
			this.WPHomePage.setSandboxModeForPayments( sandboxCookieValue );
		} );

		test.it( 'Sign in as user with currency set to JPY', function() {
			this.loginFlow = new LoginFlow( driver, 'jpyAccountUser' );
			return this.loginFlow.login();
		} );

		test.describe( 'Step One: Survey', function() {
			test.it( 'When we visit the start URL we see the survey page', function() {
				this.startPage = new StartPage( driver, { visit: true } );
				this.surveyPage = new SurveyPage( driver );
				return this.surveyPage.displayed().then( ( displayed ) => {
					return assert.equal( displayed, true, 'The survey starting page is not displayed' );
				} );
			} );

			test.it( 'Can select the first survey option', function() {
				this.surveyPage.selectFirstSurveyOptions();
			} );

			test.describe( 'Step Two: Design Type Choice', function() {
				test.it( 'Can see the design type choice page', function() {
					this.designTypeChoicePage = new DesignTypeChoicePage( driver );
					return this.designTypeChoicePage.displayed().then( ( displayed ) => {
						return assert.equal( displayed, true, 'The design type choice page is not displayed' );
					} );
				} );

				test.it( 'Can select the first design type', function() {
					this.designTypeChoicePage.selectFirstDesignType();
				} );

				test.describe( 'Step Three: Themes', function() {
					test.it( 'Can see the choose a theme page as the starting page', function() {
						this.chooseAThemePage = new ChooseAThemePage( driver );
						return this.chooseAThemePage.displayed().then( ( displayed ) => {
							return assert.equal( displayed, true, 'The choose a theme start page is not displayed' );
						} );
					} );

					test.it( 'Can select the first theme', function() {
						return this.chooseAThemePage.selectFirstTheme();
					} );

					test.describe( 'Step Four: Domains', function() {
						test.it( 'Can then see the domains page ', function() {
							this.findADomainComponent = new FindADomainComponent( driver );
							return this.findADomainComponent.displayed().then( ( displayed ) => {
								return assert.equal( displayed, true, 'The choose a domain page is not displayed' );
							} );
						} );

						test.it( 'Can search for a blog name, can see and select a free WordPress.com blog address in results', function() {
							this.findADomainComponent.searchForBlogNameAndWaitForResults( blogName );
							this.findADomainComponent.checkAndRetryForFreeBlogAddresses( expectedBlogAddresses, blogName );
							this.findADomainComponent.freeBlogAddress().then( ( actualAddress ) => {
								assert( expectedBlogAddresses.indexOf( actualAddress ) > -1, `The displayed free blog address: '${actualAddress}' was not the expected addresses: '${expectedBlogAddresses}'` );
							} );
							return this.findADomainComponent.selectFreeAddress();
						} );

						test.describe( 'Step Five: Plans', function() {
							test.it( 'Can then see the plans page', function() {
								this.pickAPlanPage = new PickAPlanPage( driver );
								return this.pickAPlanPage.displayed().then( ( displayed ) => {
									return assert.equal( displayed, true, 'The pick a plan page is not displayed' );
								} );
							} );

							test.it( 'Can see prices in JPY', function() {
								const jpySymbol = '¥';
								this.pickAPlanPage.premiumPlanPrice().then( ( price ) => {
									assert( price.indexOf( jpySymbol ) === 0, `The premium price '${price} does not start with '${jpySymbol}'` );
								} );
								this.pickAPlanPage.businessPlanPrice().then( ( price ) => {
									assert( price.indexOf( jpySymbol ) === 0, `The business price '${price} does not start with '${jpySymbol}'` );
								} );
							} );

							test.it( 'Can select the premium plan', function() {
								return this.pickAPlanPage.selectPremiumPlan();
							} );

							test.describe( 'Step Six: Processing', function() {
								test.it( 'Can then see the sign up processing page', function() {
									this.signupProcessingPage = new SignupProcessingPage( driver );
									return this.signupProcessingPage.displayed().then( ( displayed ) => {
										return assert.equal( displayed, true, 'The sign up processing page is not displayed' );
									} );
								} );

								test.it( 'The sign up processing page will finish and show a \'Continue\' button', function() {
									this.signupProcessingPage.waitForContinueButtonToBeEnabled();
								} );

								test.it( 'Clicking the \'Continue\' button continues the process', function() {
									this.signupProcessingPage.continueAlong();
								} );

								test.describe( 'Step Seven: Secure Payment Page', function() {
									test.it( 'Can then see the secure payment page', function() {
										this.securePaymentComponent = new SecurePaymentComponent( driver );
										return this.securePaymentComponent.displayed().then( ( displayed ) => {
											return assert.equal( displayed, true, 'The secure payment page is not displayed' );
										} );
									} );

									test.it( 'Can see payment total in JPY', function() {
										this.securePaymentComponent.payTotalButton().then( ( total ) => {
											const jpySymbol = '¥';
											assert( total.indexOf( jpySymbol ) !== -1, `The payment total '${total} does not contain '${jpySymbol}'` );
										} );
									} );

									test.it( 'Can enter and submit test payment details', function() {
										this.securePaymentComponent.enterTestCreditCardDetails( testCardHolder, testVisaNumber, testVisaExpiry, testCVV, testCardCountryCode, testCardPostCode );
										this.securePaymentComponent.submitPaymentDetails();
										return this.securePaymentComponent.waitForPageToDisappear();
									} );

									test.describe( 'Step Eight: Checkout Thank You Page', function() {
										test.it( 'Can see the secure check out thank you page', function() {
											this.CheckOutThankyouPage = new CheckOutThankyouPage( driver );
											return this.CheckOutThankyouPage.displayed().then( ( displayed ) => {
												return assert.equal( displayed, true, 'The checkout thank you page is not displayed' );
											} );
										} );
									} );
								} );
							} );
						} );
					} );
				} );
			} );
		} );
	} );

	test.describe( 'Add a new site on a premium paid plan with currency in USD', function() {
		this.bailSuite( true );

		const blogName = 'e2e' + new Date().getTime().toString();
		const expectedBlogAddresses = dataHelper.getExpectedFreeAddresses( blogName );
		const sandboxCookieValue = config.get( 'storeSandboxCookieValue' );
		const testCardHolder = 'End To End Testing';
		const testVisaNumber = '4483910254901646';
		const testVisaExpiry = '02/19';
		const testCVV = '300';
		const testCardCountryCode = 'AU';
		const testCardPostCode = '4000';

		test.it( 'Ensure we are not logged in as anyone', function() {
			return driverManager.ensureNotLoggedIn( driver );
		} );

		test.it( 'We can set the sandbox cookie for payments', function() {
			this.WPHomePage = new WPHomePage( driver, { visit: true } );
			this.WPHomePage.setSandboxModeForPayments( sandboxCookieValue );
		} );

		test.it( 'Sign in as user with currency set to USD', function() {
			this.loginFlow = new LoginFlow( driver, 'usdAccountUser' );
			return this.loginFlow.login();
		} );

		test.describe( 'Step One: Survey', function() {
			test.it( 'When we visit the start URL we see the survey page', function() {
				this.startPage = new StartPage( driver, { visit: true } );
				this.surveyPage = new SurveyPage( driver );
				return this.surveyPage.displayed().then( ( displayed ) => {
					return assert.equal( displayed, true, 'The survey starting page is not displayed' );
				} );
			} );

			test.it( 'Can select the first survey option', function() {
				this.surveyPage.selectFirstSurveyOptions();
			} );

			test.describe( 'Step Two: Design Type Choice', function() {
				test.it( 'Can see the design type choice page', function() {
					this.designTypeChoicePage = new DesignTypeChoicePage( driver );
					return this.designTypeChoicePage.displayed().then( ( displayed ) => {
						return assert.equal( displayed, true, 'The design type choice page is not displayed' );
					} );
				} );

				test.it( 'Can select the first design type', function() {
					this.designTypeChoicePage.selectFirstDesignType();
				} );

				test.describe( 'Step Three: Themes', function() {
					test.it( 'Can see the choose a theme page as the starting page', function() {
						this.chooseAThemePage = new ChooseAThemePage( driver );
						return this.chooseAThemePage.displayed().then( ( displayed ) => {
							return assert.equal( displayed, true, 'The choose a theme start page is not displayed' );
						} );
					} );

					test.it( 'Can select the first theme', function() {
						return this.chooseAThemePage.selectFirstTheme();
					} );

					test.describe( 'Step Four: Domains', function() {
						test.it( 'Can then see the domains page ', function() {
							this.findADomainComponent = new FindADomainComponent( driver );
							return this.findADomainComponent.displayed().then( ( displayed ) => {
								return assert.equal( displayed, true, 'The choose a domain page is not displayed' );
							} );
						} );

						test.it( 'Can search for a blog name, can see and select a free WordPress.com blog address in results', function() {
							this.findADomainComponent.searchForBlogNameAndWaitForResults( blogName );
							this.findADomainComponent.checkAndRetryForFreeBlogAddresses( expectedBlogAddresses, blogName );
							this.findADomainComponent.freeBlogAddress().then( ( actualAddress ) => {
								assert( expectedBlogAddresses.indexOf( actualAddress ) > -1, `The displayed free blog address: '${actualAddress}' was not the expected addresses: '${expectedBlogAddresses}'` );
							} );
							return this.findADomainComponent.selectFreeAddress();
						} );

						test.describe( 'Step Five: Plans', function() {
							test.it( 'Can then see the plans page', function() {
								this.pickAPlanPage = new PickAPlanPage( driver );
								return this.pickAPlanPage.displayed().then( ( displayed ) => {
									return assert.equal( displayed, true, 'The pick a plan page is not displayed' );
								} );
							} );

							test.it( 'Can see prices in USD', function() {
								const usdSymbol = '$';
								this.pickAPlanPage.premiumPlanPrice().then( ( price ) => {
									assert( price.indexOf( usdSymbol ) === 0, `The premium plan price '${price} does not start with '${usdSymbol}'` );
								} );
								this.pickAPlanPage.businessPlanPrice().then( ( price ) => {
									assert( price.indexOf( usdSymbol ) === 0, `The business plan price '${price} does not start with '${usdSymbol}'` );
								} );
							} );

							test.it( 'Can select the premium plan', function() {
								return this.pickAPlanPage.selectPremiumPlan();
							} );

							test.describe( 'Step Six: Processing', function() {
								test.it( 'Can then see the sign up processing page', function() {
									this.signupProcessingPage = new SignupProcessingPage( driver );
									return this.signupProcessingPage.displayed().then( ( displayed ) => {
										return assert.equal( displayed, true, 'The sign up processing page is not displayed' );
									} );
								} );

								test.it( 'The sign up processing page will finish and show a \'Continue\' button', function() {
									this.signupProcessingPage.waitForContinueButtonToBeEnabled();
								} );

								test.it( 'Clicking the \'Continue\' button continues the process', function() {
									this.signupProcessingPage.continueAlong();
								} );

								test.describe( 'Step Seven: Secure Payment Page', function() {
									test.it( 'Can then see the secure payment page', function() {
										this.securePaymentComponent = new SecurePaymentComponent( driver );
										return this.securePaymentComponent.displayed().then( ( displayed ) => {
											return assert.equal( displayed, true, 'The secure payment page is not displayed' );
										} );
									} );

									test.it( 'Can see payment total in USD', function() {
										this.securePaymentComponent.payTotalButton().then( ( total ) => {
											const usdSymbol = '$';
											assert( total.indexOf( usdSymbol ) !== -1, `The payment total '${total} does not contain '${usdSymbol}'` );
										} );
									} );

									test.it( 'Can enter and submit test payment details', function() {
										this.securePaymentComponent.enterTestCreditCardDetails( testCardHolder, testVisaNumber, testVisaExpiry, testCVV, testCardCountryCode, testCardPostCode );
										this.securePaymentComponent.submitPaymentDetails();
										return this.securePaymentComponent.waitForPageToDisappear();
									} );

									test.describe( 'Step Eight: Checkout Thank You Page', function() {
										test.it( 'Can see the secure check out thank you page', function() {
											this.CheckOutThankyouPage = new CheckOutThankyouPage( driver );
											return this.CheckOutThankyouPage.displayed().then( ( displayed ) => {
												return assert.equal( displayed, true, 'The checkout thank you page is not displayed' );
											} );
										} );
									} );
								} );
							} );
						} );
					} );
				} );
			} );
		} );
	} );
} );
