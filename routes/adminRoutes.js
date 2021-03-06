// ---------------------------------------- setup ----------------------------------------
// express
const express = require('express')
const adminRouter = express.Router()

// database
const dataModule = require('../modules/mongooseDataModule')

// ---------------------------------------- routes ----------------------------------------

// check if there is a valid session, all admin-routes have to pass this middleware 
adminRouter.use((req, res, next) => {
    // console.log(req.session.user)
    if (req.session.user) {
        next()
    } else {
        switch (req.method.toUpperCase()) {
            case 'GET':
                res.redirect('/login')
                break;
            case 'POST':
                res.json(10)
                break;
            default:
                res.json('nothing to show')
                break;
        }
    }
})

// // admin-panel
// adminRouter.get('/', (req, res) => {
//     res.render('./admin', { userEmail: req.session.user.email })
// })

// // add book
// adminRouter.get('/addbook', (req, res) => {
//     res.render('./addbook')
// })
adminRouter.post('/addbook', (req, res) => {
    // console.log(req.body)
    // console.log(req.files) // images & pdf -> {bookImage0:{...},bookImage1:{...},bookPdf:{...}}
    // console.log(Object.keys(req.files)) // get property-names/keys -> ['bookImage0','bookImage1','bookImage2','bookPdf']
    const bookTitle = req.body.bookTitle
    const bookDescription = req.body.bookDescription
    const bookPdf = req.files.bookPdf // req.files['bookPdf'] would be the same
    // 1 book is saved(images, pdf & json)
    // 2 not all inputs are filled
    // 3 booktitle already exists
    // 4 server side error
    if (req.files) {
        // all inputs have to be used, req.files needs more than one key -> pdf & img
        if (bookTitle && bookDescription && bookPdf && Object.keys(req.files).length > 1) {
            const bookImages = []
            for (const key in req.files) { // for-in loops through the properties of an object
                if (req.files[key].mimetype != 'application/pdf') {
                    bookImages.push(req.files[key]) // image-objects(no pdfs) are pushed
                }
            }
            dataModule.addBook(bookTitle, bookDescription, bookPdf, bookImages, req.session.user._id).then(() => {
                res.json(1)
            }).catch(error => {
                if (error == 3) {
                    res.json(3)
                } else {
                    res.json(4)
                }
            })
        } else {
            res.json(2)
        }
    } else {
        res.json(2)
    }
})

// // my books
// adminRouter.get('/mybooks', (req, res) => {
//     dataModule.userBooks(req.session.user._id).then(books => {
//         res.render('./mybooks', { books })
//     }).catch(error => {
//         res.send('404, page not found')
//     })
// })
adminRouter.post('/mybooks', (req, res) => {
    dataModule.userBooks(req.session.user._id).then(books => {
        res.json(books)
    }).catch(err => {
        res.json(2)
    })
})

// delete book
adminRouter.post('/deletebook', (req, res) => {
    // console.log(req.body.bookID)
    dataModule.deleteBook(req.body.bookID, req.session.user._id).then(() => {
        res.json(1)
    }).catch(error => {
        res.json(2)
    })
})

// // edit book
// adminRouter.get('/mybook/:id', (req, res) => {
//     const bookID = req.params.id
//     dataModule.getBook(bookID).then(book => {
//         res.render('./editbook', { book })
//     }).catch(error => {
//         res.send('404, page not found')
//     })
// })
adminRouter.post('/updatedbook', (req, res) => {
    // const {bookTitle, oldBookImagesUrls, bookDescription} = req.body
    const bookID = req.body.bookID
    const bookTitle = req.body.bookTitle
    const oldBookImagesUrls = req.body.oldBookImagesUrls
    const bookDescription = req.body.bookDescription

    // get bookPdf & bookImages from req.files
    // console.log(req.files) // bookImage & bookPdf
    let bookPdf = null
    let bookImages = []
    if (req.files) {
        bookPdf = req.files.bookPdf
        for (const key in req.files) { // for-in loops through the properties of an object
            if (req.files[key].mimetype != 'application/pdf') {
                bookImages.push(req.files[key]) // image-objects are pushed to an array
            }
        }
    }
    // remove this part of the URLs -> http://localhost:3000
    let mappedOldBookImagesUrls = JSON.parse(oldBookImagesUrls).map(element => {
        return element.substr(element.indexOf('/uploadedFiles/')) // /uploadedFiles/test_5efdd6f8d8f191349b876f6c_0.jpg
    })
    // send data to updateBook
    dataModule.updateBook(bookID, bookTitle, mappedOldBookImagesUrls, bookDescription, bookImages, bookPdf, req.session.user._id).then(book => {
        res.json(book)
    }).catch(error => {
        if (error === 'hack') {
            res.json(100)
        } else {
            res.json(2)
        }
    })
})

// // log out
// adminRouter.get('/logout', (req, res) => {
//     req.session.destroy() // destroys session & logs out
//     res.redirect('/')
// })
adminRouter.post('/logout', (req, res) => {
    req.session.destroy() // destroys session & logs out
    res.json(10)
})

// ---------------------------------------- export ----------------------------------------
module.exports = adminRouter