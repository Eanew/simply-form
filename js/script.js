const END_POINT = `http://test.kluatr.ru/api`;

const Method = {
    GET: `GET`,
    POST: `POST`,
};

const MIN_PASSWORD_LENGTH = 6;

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

const API = class {
    constructor(endPoint) {
        this._endPoint = endPoint;
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
};

const api = new API(END_POINT);

const Validity = class {
    constructor(...definitions) {
        this._fields = definitions
            .reduce((fields, { name, regular, requirement }) => ({ ...fields, [name]: { regular, requirement } }), {});
    }

    define({ name, regular, requirement }) {
        this._fields[name] = { regular, requirement };
        return this;
    }

    check(inputElement) {
        if (!this._fields[inputElement.name]) return true;

        const { regular, requirement } = this._fields[inputElement.name];
        const message = regular.test(inputElement.value) ? `` : requirement;
        
        inputElement.setCustomValidity(message);
        return !message;
    }
};

const validity = new Validity({
    name: emailInput.name,
    regular: /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
    requirement: `Пожалуйста, введите корректный адрес электронной почты`,
},
{
    name: passwordInput.name,
    regular: new RegExp(`.{${MIN_PASSWORD_LENGTH}}`),
    requirement: `Минимальная длина пароля: ${MIN_PASSWORD_LENGTH} символов`,
});

form.addEventListener(`input`, evt => validity.check(evt.target));

form.addEventListener(`submit`, evt => {
    evt.preventDefault();

    if (!validity.check(emailInput) || !validity.check(passwordInput)) return;

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

emailInput.addEventListener(`focus`, hideErrorMessage);
passwordInput.addEventListener(`focus`, hideErrorMessage);
