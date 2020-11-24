import { Builder, By, until, IWebDriverCookie, WebElement } from 'selenium-webdriver';
import readline from 'readline';
import fs from 'fs';

function askQuestion(query: string) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	return new Promise<string>((resolve) =>
		rl.question(query, (ans) => {
			rl.close();
			resolve(ans);
		})
	);
}

(async function crawlVanguard() {
	const driver = await new Builder().forBrowser('chrome').build();
	await driver.manage().setTimeouts({ implicit: 10000 });
	await driver.manage().deleteAllCookies();

	const haveCookie = fs.existsSync('./cookies.json');
	try {
		if (haveCookie) {
			const cookiesJson = JSON.parse(fs.readFileSync('./cookies.json', { encoding: 'utf8' }));
			for (const cookieJson of cookiesJson) {
				driver.manage().addCookie(cookieJson as IWebDriverCookie);
			}
			await driver.get('https://vanguard.com');
			await driver.get('https://personal.vanguard.com/us/MyHome');
		} else {
			await driver.get('https://investor.vanguard.com/my-account/log-on');

			await driver.findElement(By.id('username')).sendKeys('BryanJadot');
			await driver.findElement(By.id('password')).sendKeys('khDB$23{B=s9di{6}s9x');
			await driver.findElement(By.css('.logon-button > .vui-button > div')).click();

			let logonTitleText = await driver.findElement(By.css('h1.option2')).getText();
			if (logonTitleText === 'Log on') {
				await driver.findElement(By.id('LoginForm:USER')).sendKeys('BryanJadot');
				await driver
					.findElement(By.id('LoginForm:PASSWORD-blocked'))
					.sendKeys('khDB$23{B=s9di{6}s9x');

				await driver.findElement(By.id('LoginForm:submitInput')).click();
			}

			logonTitleText = await driver.findElement(By.css('h1.option2')).getText();
			if (logonTitleText === 'Enter your security code') {
				const code = await askQuestion('What is your 2FA code? ');
				// eslint-disable-next-line no-console
				console.log('Thank you!');

				let codeInput: WebElement | undefined;
				await driver.findElement(By.id('code')).then(
					function (element) {
						codeInput = element;
					},
					function () {
						/* do nothing */
					}
				);
				if (!codeInput) {
					codeInput = await driver.findElement(By.id('LoginForm:ANSWER'));
				}
				codeInput.sendKeys(code);

				let rememberRadio: WebElement | undefined;
				await driver.findElement(By.id('YES')).then(
					function (element) {
						rememberRadio = element;
					},
					function () {
						/* do nothing */
					}
				);
				if (!rememberRadio) {
					rememberRadio = await driver.findElement(By.id('LoginForm:DEVICE'));
				}
				rememberRadio.click();

				let continueButton: WebElement | undefined;
				await driver.findElement(By.css('form span > .vuiButton:nth-child(2)')).then(
					function (element) {
						continueButton = element;
					},
					function () {
						/* do nothing */
					}
				);
				if (!continueButton) {
					continueButton = await driver.findElement(By.id('CONTINUE'));
				}
				continueButton.click();
			}
		}

		await driver.wait(until.urlIs('https://personal.vanguard.com/us/MyHome'));
		const cookies = await driver.manage().getCookies();
		fs.writeFileSync('./cookies.json', JSON.stringify(cookies));
	} finally {
		await driver.quit();
	}
})();
