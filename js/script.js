const END_POINT = `http://test.kluatr.ru/api`;

const Method = {
    GET: `GET`,
    POST: `POST`,
};

const MIN_PASSWORD_LENGTH = 6;

const Regular = {
    VALID_EMAIL: /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
    VALID_PASSWORD: new RegExp(`.{${MIN_PASSWORD_LENGTH}}`),
};

const API = class {
    constructor(endPoint) {
        this._endPoint = endPoint;
    }
    
    logIn(email, password) {
        return this._request(`user/login`, {
            method: Method.POST,
            headers: new Headers({ 'Content-Type': `application/json` }),
            body: JSON.stringify({ email, password }),
            credentials: `include`,
        });
    }
    
    getUserData() {
        return this._request(`user/data`, { credentials: `include` });
    }
    
    _request(path, { method = Method.GET, headers = new Headers(), body = null, credentials = `same-origin` }) {
        const url = `${this._endPoint}/${path}`;
        const options = { method, headers, body, credentials };

        return fetch(url, options)
            .then(response => response.json())
            .then(response => {
                if (!response.success) {
                    throw new Error(response.error || `Что-то пошло не так. Пожалуйста, попробуйте позже.`);
                }
                return response.data || {};
            })
            .catch(error => {
                throw error;
            });
    }
};

const Validity = class {
    constructor(...definitions) {
        this._fields = {};
        definitions.forEach(definition => this.add(definition));
    }

    add({ name = ``, verification = new RegExp(), requirement = `Пожалуйста, введите корректные данные` }) {
        if (typeof verification === `function`) verification.test = verification;

        this._fields[name] = { verification, requirement };
        return this;
    }

    check(inputElement) {
        if (!this._fields[inputElement.name]) return true;

        const { verification, requirement } = this._fields[inputElement.name];
        const message = verification.test(inputElement.value) ? `` : requirement;
        
        inputElement.setCustomValidity(message);
        return !message;
    }
};

const form = document.querySelector(`.auth__form`);
const title = form.querySelector(`.auth__title`);
const userBonus = form.querySelector(`.auth__bonus`);
const bonusCount = userBonus.querySelector(`.auth__bonus-count`);
const emailInput = form.querySelector(`.auth__input--email`);
const passwordInput = form.querySelector(`.auth__input--password`);
const errorMessage = document.querySelector(`.auth__message`);
const button = form.querySelector(`.auth__button`);

const greet = name => {
    title.textContent = `Здравствуйте${name ? `, ${name}!` : `!`}`;
};

const showBonus = bonus => {
    bonusCount.textContent = parseInt(bonus);
    userBonus.classList.remove(`hidden`);
};

const showErrorMessage = ({ message }) => {
    errorMessage.textContent = message;
    errorMessage.classList.remove(`hidden`);
};

const hideErrorMessage = () => {
    errorMessage.classList.add(`hidden`);
};

const api = new API(END_POINT);

const validity = new Validity({
        name: emailInput.name,
        verification: Regular.VALID_EMAIL,
        requirement: `Пожалуйста, введите корректный адрес электронной почты`,
    },
    {
        name: passwordInput.name,
        verification: Regular.VALID_PASSWORD,
        requirement: `Минимальная длина пароля: ${MIN_PASSWORD_LENGTH} символов`,
    });

form.addEventListener(`input`, evt => validity.check(evt.target));

form.addEventListener(`submit`, evt => {
    evt.preventDefault();

    if (!validity.check(emailInput) || !validity.check(passwordInput)) return;

    hideErrorMessage();
    emailInput.disabled = true;
    passwordInput.disabled = true;
    button.disabled = true;

    api.logIn(emailInput.value, passwordInput.value)
        .then(({ name }) => {
            greet(name);
            form.reset();
            api.getUserData()
                .then(({ bonus }) => showBonus(bonus));
        })
        .catch(showErrorMessage)
        .finally(() => {
            emailInput.disabled = false;
            passwordInput.disabled = false;
            button.disabled = false;
        });
});
