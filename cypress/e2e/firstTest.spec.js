/// <reference types="cypress" />

describe('Test with backend', () => {
    beforeEach('login to app', () => {
        // 1st way of going 
        cy.intercept('GET', 'https://api.realworld.io/api/tags', {fixture: 'tags.json'});
        
        // // 2nd way of going - alternative way to intercept by path
        // cy.intercept({method: 'GET', 'path': 'tags'}, {fixture: 'tags.json'});

        cy.ligonToApplication();
    })
    
    it('verify correct request and response - Create New Article', () => {

        cy.intercept('POST', 'https://api.realworld.io/api/articles/').as('postArticle')

        cy.contains('New Article').click();
        cy.get('[formcontrolname="title"]').type('First article !@#$');
        cy.get('[formcontrolname="description"]').type('First article description');
        cy.get('[formcontrolname="body"]').type('First article body');
        cy.contains('Publish Article').click();

        cy.wait('@postArticle');
        cy.get('@postArticle').then(xhr => {
            expect(xhr.response.statusCode).to.equal(200);
            expect(xhr.request.body.article.body).to.equal('First article body');
            expect(xhr.response.body.article.description).to.equal('First article description');
        });
        
    });

    it('intercept and modify request and response - Create New Article', () => {

        // // way of modify request
        cy.intercept('POST', 'https://api.realworld.io/api/articles/', req => {
            req.body.article.description = "First article description modify";
        }).as('postArticle');

        // way of modify response
        // cy.intercept('POST', 'https://api.realworld.io/api/articles/', req => {
        //     req.reply(res => {
        //          expect(res.body.article.description).to.equal('First article description modify');
        //         res.body.article.description = "First article description"
        //     })
        // }).as('postArticle');

        cy.contains('New Article').click();
        cy.get('[formcontrolname="title"]').type('First article !@#$%^');
        cy.get('[formcontrolname="description"]').type('First article description');
        cy.get('[formcontrolname="body"]').type('First article body');
        cy.contains('Publish Article').click();

        cy.wait('@postArticle');
        cy.get('@postArticle').then(xhr => {
            expect(xhr.response.statusCode).to.equal(200);
            expect(xhr.request.body.article.body).to.equal('First article body');
            expect(xhr.response.body.article.description).to.equal('First article description modify');
        });
        
    });

    it('verify popular tags are displayed', () =>{
        cy.get('.tag-list')
        .should('contain', 'testing')
        .and('contain', 'javascript')
        .and('contain', 'typescript');
    });

    it('verify golbal feed', () => {
        cy.intercept('GET', 'https://api.realworld.io/api/articles/feed*', {'articles': [], 'articlesCount': 0});
        cy.intercept('GET', 'https://api.realworld.io/api/articles*', {fixture: 'articles.json'});
        
        cy.contains('Global Feed').click();
        cy.get('app-article-list button').then(heartList => {
            expect(heartList[0]).to.contain(0);
            expect(heartList[1]).to.contain(5);
        });

        // way of update fixtures file with in test
        cy.fixture('articles.json').then(file => {
            const articleLink = file.articles[0].slug;
            file.articles[0].favoritesCount = 1;

            cy.intercept('POST', `https://api.realworld.io/api/articles/${articleLink}/favorite`, file);
        })

        cy.get('app-article-list button').eq(0).click().should('contain', '1');
    });

    it('delete article in a global feed', () => {
        const userCredentials = {user: {email: "artem.bondar16@gmail.com", password: "CypressTest1"}};

        const bodyRequest = {article: {tagList: [], title: "@Sample Title", description: "sample description", body: "sample body"}}

        // ****  used the token request within the test ****
        // cy.request('POST', 'https://api.realworld.io/api/users/login', userCredentials)
        // .its('body').then(body => {
        //     const token = body.user.token;

        //     cy.request({
        //             url: 'https://api.realworld.io/api/articles/',
        //             headers: {'authorization': 'Token '+token},
        //             method: 'POST',
        //             body: bodyRequest
        //         }).then(res => {
        //             expect(res.status).to.equal(200)
        //         });
            
        //         cy.contains('Global Feed').click();
        //         cy.get('.article-preview').first().click();
        //         cy.get('.article-actions').contains('Delete Article').click()

        //         cy.wait(500);

        //         cy.request({
        //             url: 'https://api.realworld.io/api/articles/?limit=10&offset=0',
        //             headers: {'authorization': 'Token '+token},
        //             method: 'GET',
        //         }).its('body').then(body => {
        //             expect(body.articles[0].title).not.to.equal('@Sample Title');
        //         });
        //     });
        
        // ****  used the token saved in the localStorage ****
        cy.get('@token').then(token => {

            cy.request({
                    url: 'https://api.realworld.io/api/articles/',
                    headers: {'authorization': 'Token '+token},
                    method: 'POST',
                    body: bodyRequest
                }).then(res => {
                    expect(res.status).to.equal(200)
                });
            
                cy.contains('Global Feed').click();
                cy.get('.article-preview').first().click();
                cy.get('.article-actions').contains('Delete Article').click()

                cy.wait(500);

                cy.request({
                    url: 'https://api.realworld.io/api/articles/?limit=10&offset=0',
                    headers: {'authorization': 'Token '+token},
                    method: 'GET',
                }).its('body').then(body => {
                    expect(body.articles[0].title).not.to.equal('@Sample Title');
                });
            });
    });
    
    
});